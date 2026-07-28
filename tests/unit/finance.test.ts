import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildRevenueByDay,
  getPeriodRange,
  summariseFinance,
  type FinanceOrder,
} from "@/lib/finance";

function order(overrides: Partial<FinanceOrder> = {}): FinanceOrder {
  return { status: "completed", total: 100, orderDay: "2026-07-28", ...overrides };
}

describe("getPeriodRange", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("today runs from today to today", () => {
    // 2026-07-28T10:00Z is 2026-07-28T15:30 in Asia/Colombo
    vi.setSystemTime(new Date("2026-07-28T10:00:00Z"));
    expect(getPeriodRange("today")).toEqual({ from: "2026-07-28", to: "2026-07-28" });
  });

  it("week starts on the Colombo-local Monday", () => {
    // Tuesday 2026-07-28 (Colombo) — Monday is 2026-07-27
    vi.setSystemTime(new Date("2026-07-28T10:00:00Z"));
    expect(getPeriodRange("week")).toEqual({ from: "2026-07-27", to: "2026-07-28" });
  });

  it("month starts on the 1st of the current Colombo month", () => {
    vi.setSystemTime(new Date("2026-07-28T10:00:00Z"));
    expect(getPeriodRange("month")).toEqual({ from: "2026-07-01", to: "2026-07-28" });
  });

  it("quarter starts on the 1st of the current calendar quarter", () => {
    // July is in Q3 (Jul-Sep)
    vi.setSystemTime(new Date("2026-07-28T10:00:00Z"));
    expect(getPeriodRange("quarter")).toEqual({ from: "2026-07-01", to: "2026-07-28" });
  });

  it("year starts on January 1st", () => {
    vi.setSystemTime(new Date("2026-07-28T10:00:00Z"));
    expect(getPeriodRange("year")).toEqual({ from: "2026-01-01", to: "2026-07-28" });
  });

  it("never crosses a Colombo day boundary near UTC midnight", () => {
    // 2026-07-27T18:35:00Z is 2026-07-28T00:05 in Asia/Colombo
    vi.setSystemTime(new Date("2026-07-27T18:35:00Z"));
    expect(getPeriodRange("today")).toEqual({ from: "2026-07-28", to: "2026-07-28" });
  });
});

describe("summariseFinance", () => {
  it("ties net profit to income minus expenses for a mix of statuses", () => {
    const orders = [
      order({ total: 1000, status: "completed" }),
      order({ total: 500, status: "completed" }),
      order({ total: 300, status: "open" }),
      order({ total: 200, status: "voided" }),
    ];
    const summary = summariseFinance(orders, [400, 100]);

    expect(summary.totalIncome).toBe(1500);
    expect(summary.totalExpenses).toBe(500);
    expect(summary.netProfit).toBe(1000);
    expect(summary.totalOrders).toBe(4);
  });

  it("handles decimal money without float drift", () => {
    const orders = [order({ total: 10.1 }), order({ total: 20.2 })];
    const summary = summariseFinance(orders, [5.05]);

    expect(summary.totalIncome).toBe(30.3);
    expect(summary.netProfit).toBe(25.25);
  });

  it("returns zero net profit for no orders and no expenses", () => {
    expect(summariseFinance([], [])).toEqual({
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
      totalOrders: 0,
    });
  });

  it("ignores open and voided orders for income but still counts them as orders", () => {
    const orders = [order({ status: "open", total: 999 }), order({ status: "voided", total: 999 })];
    const summary = summariseFinance(orders, []);

    expect(summary.totalIncome).toBe(0);
    expect(summary.totalOrders).toBe(2);
  });
});

describe("buildRevenueByDay", () => {
  it("zero-fills every day in the range, not just days with orders", () => {
    const orders = [order({ orderDay: "2026-07-01", total: 100 })];
    const days = buildRevenueByDay(orders, { from: "2026-07-01", to: "2026-07-03" });

    expect(days).toEqual([
      { date: "2026-07-01", revenue: 100 },
      { date: "2026-07-02", revenue: 0 },
      { date: "2026-07-03", revenue: 0 },
    ]);
  });

  it("sums multiple completed orders on the same day and excludes non-completed ones", () => {
    const orders = [
      order({ orderDay: "2026-07-01", total: 100, status: "completed" }),
      order({ orderDay: "2026-07-01", total: 50, status: "completed" }),
      order({ orderDay: "2026-07-01", total: 999, status: "open" }),
    ];
    const days = buildRevenueByDay(orders, { from: "2026-07-01", to: "2026-07-01" });

    expect(days).toEqual([{ date: "2026-07-01", revenue: 150 }]);
  });

  it("handles a single-day range", () => {
    const days = buildRevenueByDay([], { from: "2026-07-15", to: "2026-07-15" });
    expect(days).toEqual([{ date: "2026-07-15", revenue: 0 }]);
  });
});
