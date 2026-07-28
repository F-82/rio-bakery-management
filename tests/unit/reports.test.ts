import { describe, expect, it } from "vitest";
import {
  buildCounterBreakdown,
  buildDetailCsv,
  buildPaymentBreakdown,
  buildSourceBreakdown,
  formatSharePercent,
  summariseSales,
  type ReportOrder,
} from "@/lib/reports";

function order(overrides: Partial<ReportOrder> = {}): ReportOrder {
  return {
    id: "1",
    orderNumber: "001",
    status: "completed",
    total: 100,
    createdAt: "2026-07-28T10:00:00Z",
    counterId: "bakery-id",
    counterName: "Bakery",
    counterKind: "bakery",
    source: "pos",
    paymentMethod: "cash",
    ...overrides,
  };
}

describe("summariseSales", () => {
  it("counts revenue from completed orders only, but counts every order", () => {
    const orders = [
      order({ id: "1", total: 1000, status: "completed" }),
      order({ id: "2", total: 500, status: "completed" }),
      order({ id: "3", total: 300, status: "open" }),
      order({ id: "4", total: 200, status: "voided" }),
    ];
    const summary = summariseSales(orders);

    expect(summary.revenue).toBe(1500);
    expect(summary.completedOrders).toBe(2);
    expect(summary.totalOrders).toBe(4);
  });

  it("handles decimal money without float drift", () => {
    const orders = [order({ id: "1", total: 10.1 }), order({ id: "2", total: 20.2 })];
    expect(summariseSales(orders).revenue).toBe(30.3);
  });

  it("returns zero for no orders", () => {
    expect(summariseSales([])).toEqual({ revenue: 0, completedOrders: 0, totalOrders: 0 });
  });
});

describe("breakdown done-when: every breakdown sums to total revenue", () => {
  const orders = [
    order({ id: "1", total: 1000, status: "completed", counterId: "bakery-id", counterName: "Bakery", source: "pos", paymentMethod: "cash" }),
    order({ id: "2", total: 500, status: "completed", counterId: "hotplate-id", counterName: "Hot Plate", source: "phone", paymentMethod: "card" }),
    order({ id: "3", total: 250, status: "completed", counterId: null, counterName: null, source: "pos", paymentMethod: null }),
    order({ id: "4", total: 999, status: "open" }),
    order({ id: "5", total: 999, status: "voided" }),
  ];
  const totalRevenue = summariseSales(orders).revenue;

  it("by-counter breakdown sums to total revenue", () => {
    const breakdown = buildCounterBreakdown(orders);
    const sum = breakdown.reduce((acc, row) => acc + row.revenue, 0);
    expect(sum).toBe(totalRevenue);
  });

  it("by-source breakdown sums to total revenue", () => {
    const breakdown = buildSourceBreakdown(orders);
    const sum = breakdown.reduce((acc, row) => acc + row.revenue, 0);
    expect(sum).toBe(totalRevenue);
  });

  it("by-payment breakdown sums to total revenue", () => {
    const breakdown = buildPaymentBreakdown(orders);
    const sum = breakdown.reduce((acc, row) => acc + row.revenue, 0);
    expect(sum).toBe(totalRevenue);
  });

  it("groups a null counter under its own row rather than dropping the order", () => {
    const breakdown = buildCounterBreakdown(orders);
    const noCounterRow = breakdown.find((row) => row.key === "none");
    expect(noCounterRow).toEqual({ key: "none", label: "No counter", revenue: 250, orderCount: 1 });
  });

  it("sorts rows by revenue descending", () => {
    const breakdown = buildCounterBreakdown(orders);
    expect(breakdown.map((row) => row.revenue)).toEqual([1000, 500, 250]);
  });
});

describe("formatSharePercent", () => {
  it("formats a row's share of total revenue", () => {
    expect(formatSharePercent(500, 1000)).toBe("50%");
  });

  it("returns 0% instead of dividing by zero", () => {
    expect(formatSharePercent(0, 0)).toBe("0%");
  });

  it("keeps one decimal place for an uneven split", () => {
    expect(formatSharePercent(1, 3)).toBe("33.3%");
  });
});

describe("buildDetailCsv", () => {
  it("includes a header row and one row per order", () => {
    const csv = buildDetailCsv([order()]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("Order number,Date,Counter,Source,Payment method,Status,Total");
    expect(lines[1]).toContain("001");
  });

  it("quotes a field containing a comma so it doesn't shift columns", () => {
    const csv = buildDetailCsv([order({ counterName: "Bakery, Main" })]);
    expect(csv).toContain('"Bakery, Main"');
  });

  it("renders — for a missing payment method", () => {
    const csv = buildDetailCsv([order({ paymentMethod: null })]);
    expect(csv).toContain("—");
  });
});
