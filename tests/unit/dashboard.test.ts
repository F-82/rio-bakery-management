import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  colomboToday,
  countLowStock,
  getUnresolvedPrintFailures,
  sumCompletedRevenue,
  summariseOrders,
  type DashboardOrder,
  type DashboardPrintJob,
} from "@/lib/dashboard";

function order(overrides: Partial<DashboardOrder> = {}): DashboardOrder {
  return {
    id: "order-1",
    status: "completed",
    total: 100,
    orderNumber: "001",
    orderDay: "2026-07-28",
    ...overrides,
  };
}

function printJob(overrides: Partial<DashboardPrintJob> = {}): DashboardPrintJob {
  return {
    id: "job-1",
    orderId: "order-1",
    target: "kitchen_ticket",
    status: "failed",
    lastError: null,
    createdAt: "2026-07-28T10:00:00Z",
    ...overrides,
  };
}

describe("colomboToday", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reports the next Colombo date just after local midnight", () => {
    // 2026-07-27T18:35:00Z is 2026-07-28T00:05 in Asia/Colombo (UTC+5:30)
    vi.setSystemTime(new Date("2026-07-27T18:35:00Z"));
    expect(colomboToday()).toBe("2026-07-28");
  });

  it("still reports the same Colombo date just before local midnight", () => {
    // 2026-07-27T18:29:00Z is 2026-07-27T23:59 in Asia/Colombo
    vi.setSystemTime(new Date("2026-07-27T18:29:00Z"));
    expect(colomboToday()).toBe("2026-07-27");
  });
});

describe("summariseOrders", () => {
  it("counts total/completed/pending/cancelled from mixed statuses", () => {
    const orders = [
      order({ id: "1", status: "completed" }),
      order({ id: "2", status: "completed" }),
      order({ id: "3", status: "open" }),
      order({ id: "4", status: "voided" }),
    ];
    expect(summariseOrders(orders)).toEqual({ total: 4, completed: 2, pending: 1, cancelled: 1 });
  });

  it("returns all zeros for an empty day", () => {
    expect(summariseOrders([])).toEqual({ total: 0, completed: 0, pending: 0, cancelled: 0 });
  });
});

describe("sumCompletedRevenue", () => {
  it("sums only completed orders, ignoring open and voided", () => {
    const orders = [
      order({ id: "1", status: "completed", total: 1200.5 }),
      order({ id: "2", status: "open", total: 500 }),
      order({ id: "3", status: "voided", total: 999 }),
      order({ id: "4", status: "completed", total: 299.5 }),
    ];
    expect(sumCompletedRevenue(orders).toNumber()).toBe(1500);
  });
});

describe("getUnresolvedPrintFailures", () => {
  const orderNumbers = new Map([["order-1", "047"]]);

  it("surfaces a failed job with no later attempt", () => {
    const jobs = [printJob({ id: "job-1", status: "failed", createdAt: "2026-07-28T10:00:00Z" })];
    const result = getUnresolvedPrintFailures(jobs, orderNumbers);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "job-1", orderNumber: "047" });
  });

  it("hides a failure once a newer reprint for the same order/target succeeds", () => {
    const jobs = [
      printJob({ id: "job-1", status: "failed", createdAt: "2026-07-28T10:00:00Z" }),
      printJob({ id: "job-2", status: "done", createdAt: "2026-07-28T10:05:00Z" }),
    ];
    expect(getUnresolvedPrintFailures(jobs, orderNumbers)).toHaveLength(0);
  });

  it("hides the failure once a reprint is queued, even before it's confirmed printed", () => {
    const jobs = [
      printJob({ id: "job-1", status: "failed", createdAt: "2026-07-28T10:00:00Z" }),
      printJob({ id: "job-2", status: "queued", createdAt: "2026-07-28T10:05:00Z" }),
    ];
    expect(getUnresolvedPrintFailures(jobs, orderNumbers)).toHaveLength(0);
  });

  it("treats different targets on the same order independently", () => {
    const jobs = [
      printJob({ id: "job-1", target: "kitchen_ticket", status: "failed", createdAt: "2026-07-28T10:00:00Z" }),
      printJob({ id: "job-2", target: "customer_receipt", status: "done", createdAt: "2026-07-28T10:00:00Z" }),
    ];
    const result = getUnresolvedPrintFailures(jobs, orderNumbers);
    expect(result).toHaveLength(1);
    expect(result[0].target).toBe("kitchen_ticket");
  });

  it("falls back to an em dash when the order isn't in the lookup", () => {
    const jobs = [printJob({ id: "job-1", orderId: "unknown-order" })];
    expect(getUnresolvedPrintFailures(jobs, orderNumbers)[0].orderNumber).toBe("—");
  });
});

describe("countLowStock", () => {
  it("counts items at or below their threshold, including negative stock", () => {
    const levels = [
      { id: "1", qtyOnHand: 500, lowStockThreshold: 200 },
      { id: "2", qtyOnHand: 200, lowStockThreshold: 200 },
      { id: "3", qtyOnHand: -5, lowStockThreshold: 200 },
    ];
    expect(countLowStock(levels)).toBe(2);
  });

  it("returns 0 when nothing is low", () => {
    expect(countLowStock([{ id: "1", qtyOnHand: 500, lowStockThreshold: 200 }])).toBe(0);
  });
});
