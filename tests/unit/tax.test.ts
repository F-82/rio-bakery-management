import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildTaxCategoryBreakdown,
  buildTaxCsv,
  calculateNetTaxableIncome,
  currentTaxPeriodValue,
  getTaxPeriodRange,
  summariseDeductibleExpenses,
  summariseGrossRevenue,
  summariseTaxableRevenue,
  type TaxCategoryLine,
  type TaxOrder,
} from "@/lib/tax";

function order(overrides: Partial<TaxOrder> = {}): TaxOrder {
  return { status: "completed", total: 100, ...overrides };
}

function line(overrides: Partial<TaxCategoryLine> = {}): TaxCategoryLine {
  return { taxCategory: "standard", lineTotal: 100, ...overrides };
}

describe("summariseGrossRevenue", () => {
  it("done-when: equals the sum of completed order totals for the period, to the cent", () => {
    const orders = [
      order({ total: 1000.05, status: "completed" }),
      order({ total: 499.95, status: "completed" }),
      order({ total: 300, status: "open" }),
      order({ total: 200, status: "voided" }),
    ];
    expect(summariseGrossRevenue(orders)).toBe(1500);
  });

  it("returns zero for no orders", () => {
    expect(summariseGrossRevenue([])).toBe(0);
  });

  it("never adjusts the figure by any factor — it is the raw completed-order sum", () => {
    const orders = [order({ total: 999.99 }), order({ total: 0.01 })];
    expect(summariseGrossRevenue(orders)).toBe(1000);
  });
});

describe("buildTaxCategoryBreakdown", () => {
  it("returns all 3 categories zero-filled, even with no lines", () => {
    expect(buildTaxCategoryBreakdown([])).toEqual([
      { category: "standard", label: "Standard", revenue: 0 },
      { category: "zero_rated", label: "Zero-rated", revenue: 0 },
      { category: "exempt", label: "Exempt", revenue: 0 },
    ]);
  });

  it("sums line_total per category", () => {
    const lines = [
      line({ taxCategory: "standard", lineTotal: 100 }),
      line({ taxCategory: "standard", lineTotal: 50 }),
      line({ taxCategory: "zero_rated", lineTotal: 30 }),
      line({ taxCategory: "exempt", lineTotal: 20 }),
    ];
    const breakdown = buildTaxCategoryBreakdown(lines);
    expect(breakdown.find((row) => row.category === "standard")?.revenue).toBe(150);
    expect(breakdown.find((row) => row.category === "zero_rated")?.revenue).toBe(30);
    expect(breakdown.find((row) => row.category === "exempt")?.revenue).toBe(20);
  });
});

describe("summariseTaxableRevenue", () => {
  it("counts standard-rated lines only, excluding zero-rated and exempt", () => {
    const lines = [
      line({ taxCategory: "standard", lineTotal: 100 }),
      line({ taxCategory: "zero_rated", lineTotal: 999 }),
      line({ taxCategory: "exempt", lineTotal: 999 }),
    ];
    expect(summariseTaxableRevenue(lines)).toBe(100);
  });

  it("returns zero when nothing is standard-rated", () => {
    const lines = [line({ taxCategory: "zero_rated", lineTotal: 100 }), line({ taxCategory: "exempt", lineTotal: 100 })];
    expect(summariseTaxableRevenue(lines)).toBe(0);
  });
});

describe("calculateNetTaxableIncome", () => {
  it("subtracts deductible expenses from taxable revenue", () => {
    expect(calculateNetTaxableIncome(1000, 300)).toBe(700);
  });

  it("can go negative — no clamp exists", () => {
    expect(calculateNetTaxableIncome(100, 500)).toBe(-400);
  });

  it("handles decimal money without float drift", () => {
    expect(calculateNetTaxableIncome(10.1, 5.05)).toBe(5.05);
  });
});

describe("summariseDeductibleExpenses", () => {
  it("sums plain amounts", () => {
    expect(summariseDeductibleExpenses([100, 50.5, 25])).toBe(175.5);
  });

  it("returns zero for no expenses", () => {
    expect(summariseDeductibleExpenses([])).toBe(0);
  });
});

describe("currentTaxPeriodValue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("monthly", () => {
    vi.setSystemTime(new Date("2026-07-28T10:00:00Z"));
    expect(currentTaxPeriodValue("monthly")).toBe("2026-07");
  });

  it("quarterly", () => {
    vi.setSystemTime(new Date("2026-07-28T10:00:00Z"));
    expect(currentTaxPeriodValue("quarterly")).toBe("2026-Q3");
  });

  it("annual", () => {
    vi.setSystemTime(new Date("2026-07-28T10:00:00Z"));
    expect(currentTaxPeriodValue("annual")).toBe("2026");
  });

  it("never crosses a Colombo day boundary near UTC midnight", () => {
    // 2026-06-30T18:35:00Z is 2026-07-01T00:05 in Asia/Colombo
    vi.setSystemTime(new Date("2026-06-30T18:35:00Z"));
    expect(currentTaxPeriodValue("monthly")).toBe("2026-07");
  });
});

describe("getTaxPeriodRange", () => {
  it("monthly covers the whole calendar month, not clamped to today", () => {
    expect(getTaxPeriodRange("monthly", "2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });

  it("monthly handles a leap year February", () => {
    expect(getTaxPeriodRange("monthly", "2028-02")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
  });

  it("quarterly covers the 3-month calendar quarter", () => {
    expect(getTaxPeriodRange("quarterly", "2026-Q3")).toEqual({ from: "2026-07-01", to: "2026-09-30" });
  });

  it("quarterly Q1 starts in January", () => {
    expect(getTaxPeriodRange("quarterly", "2026-Q1")).toEqual({ from: "2026-01-01", to: "2026-03-31" });
  });

  it("annual covers the full calendar year", () => {
    expect(getTaxPeriodRange("annual", "2026")).toEqual({ from: "2026-01-01", to: "2026-12-31" });
  });

  it("falls back to the current period for a malformed value instead of throwing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-28T10:00:00Z"));
    expect(getTaxPeriodRange("monthly", "garbage")).toEqual({ from: "2026-07-01", to: "2026-07-31" });
    vi.useRealTimers();
  });
});

describe("buildTaxCsv", () => {
  it("includes summary, category breakdown and itemised expenses", () => {
    const csv = buildTaxCsv({
      range: { from: "2026-07-01", to: "2026-07-31" },
      grossRevenue: 1000,
      categoryBreakdown: [
        { category: "standard", label: "Standard", revenue: 800 },
        { category: "zero_rated", label: "Zero-rated", revenue: 150 },
        { category: "exempt", label: "Exempt", revenue: 50 },
      ],
      taxableRevenue: 800,
      deductibleExpenses: 200,
      netTaxableIncome: 600,
      expenses: [{ id: "1", date: "2026-07-15", category: "Rent", amount: 200, note: null }],
    });

    expect(csv).toContain("Gross revenue");
    expect(csv).toContain("Standard");
    expect(csv).toContain("Zero-rated");
    expect(csv).toContain("Exempt");
    expect(csv).toContain("Rent");
    expect(csv).toContain("—"); // no note
  });

  it("quotes a field containing a comma", () => {
    const csv = buildTaxCsv({
      range: { from: "2026-07-01", to: "2026-07-31" },
      grossRevenue: 0,
      categoryBreakdown: [],
      taxableRevenue: 0,
      deductibleExpenses: 100,
      netTaxableIncome: -100,
      expenses: [{ id: "1", date: "2026-07-15", category: "Rent, utilities", amount: 100, note: null }],
    });
    expect(csv).toContain('"Rent, utilities"');
  });
});
