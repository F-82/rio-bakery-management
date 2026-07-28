import { Decimal } from "decimal.js";
import type { Database } from "@/types/database";

/**
 * Pure dashboard math, kept separate from lib/queries/dashboard.ts so it can
 * be imported from the "use client" realtime component too — the queries
 * module pulls in lib/supabase/server (next/headers), which a client
 * component can't bundle. Every number here is derived by the same code on
 * first render and on every realtime patch, so the two can never drift.
 */

export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PrintStatusValue = Database["public"]["Enums"]["print_status"];
export type PrintTarget = Database["public"]["Enums"]["print_target"];

export type DashboardOrder = {
  id: string;
  status: OrderStatus;
  total: number;
  orderNumber: string;
  orderDay: string;
};

export type DashboardPrintJob = {
  id: string;
  orderId: string;
  target: PrintTarget;
  status: PrintStatusValue;
  lastError: string | null;
  createdAt: string;
};

export type StockLevel = {
  id: string;
  qtyOnHand: number;
  lowStockThreshold: number;
};

export type OrdersSummary = { total: number; completed: number; pending: number; cancelled: number };

/** Sri Lanka is a fixed UTC+05:30 offset with no DST — safe without a timezone library. */
export function colomboToday(): string {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Total / completed ("open") / pending / cancelled ("voided") for the 2x2 grid. */
export function summariseOrders(orders: DashboardOrder[]): OrdersSummary {
  return orders.reduce(
    (acc, order) => {
      acc.total += 1;
      if (order.status === "completed") acc.completed += 1;
      else if (order.status === "open") acc.pending += 1;
      else acc.cancelled += 1;
      return acc;
    },
    { total: 0, completed: 0, pending: 0, cancelled: 0 },
  );
}

/** Today's sales — completed orders only, an open order hasn't been paid for yet. */
export function sumCompletedRevenue(orders: DashboardOrder[]): Decimal {
  return orders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum.plus(order.total), new Decimal(0));
}

export type UnresolvedPrintFailure = DashboardPrintJob & { orderNumber: string };

/**
 * Reprint inserts a new row against the same order/target rather than
 * mutating the old one (ARCHITECTURE.md §Printing), so a failed row stays
 * `failed` in history forever even after a successful reprint. "Still
 * failing" therefore means the *latest* job for a given (order, target)
 * pair is the failed one, not merely that a failed row exists somewhere.
 */
export function getUnresolvedPrintFailures(
  jobs: DashboardPrintJob[],
  orderNumbers: Map<string, string>,
): UnresolvedPrintFailure[] {
  const latestByPair = new Map<string, DashboardPrintJob>();
  for (const job of jobs) {
    const key = `${job.orderId}:${job.target}`;
    const current = latestByPair.get(key);
    if (!current || job.createdAt > current.createdAt) latestByPair.set(key, job);
  }

  return [...latestByPair.values()]
    .filter((job) => job.status === "failed")
    .map((job) => ({ ...job, orderNumber: orderNumbers.get(job.orderId) ?? "—" }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** qty_on_hand <= low_stock_threshold — mirrors LowStockBadge's own condition. */
export function countLowStock(levels: StockLevel[]): number {
  return levels.filter((level) => new Decimal(level.qtyOnHand).lessThanOrEqualTo(level.lowStockThreshold)).length;
}
