import { Decimal } from "decimal.js";
import { formatDate, formatLKR } from "@/lib/format";
import type { ItemsSoldRow } from "@/lib/items-sold";
import type { Database } from "@/types/database";

/**
 * Pure sales-report math, same split as lib/finance.ts and lib/dashboard.ts —
 * one module of testable functions, one module of Supabase reads
 * (lib/queries/reports.ts), no drift between what's tested and what runs.
 */

export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type CounterKind = Database["public"]["Enums"]["counter_kind"];

export type ReportOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  counterId: string | null;
  counterName: string | null;
  counterKind: CounterKind | null;
  source: string;
  paymentMethod: string | null;
};

export type SalesSummary = {
  /** Completed orders only — an open order hasn't been paid for, a voided one was reversed (same rule as finance/dashboard). */
  revenue: number;
  completedOrders: number;
  /** Every order in the range regardless of status — matches the "orders" card wording in STEPS.md §15. */
  totalOrders: number;
};

export function summariseSales(orders: ReportOrder[]): SalesSummary {
  const completed = orders.filter((order) => order.status === "completed");
  const revenue = completed.reduce((sum, order) => sum.plus(order.total), new Decimal(0));

  return {
    revenue: revenue.toNumber(),
    completedOrders: completed.length,
    totalOrders: orders.length,
  };
}

export type BreakdownRow = { key: string; label: string; revenue: number; orderCount: number };

function buildBreakdown(
  orders: ReportOrder[],
  keyFn: (order: ReportOrder) => { key: string; label: string },
): BreakdownRow[] {
  const completed = orders.filter((order) => order.status === "completed");
  const byKey = new Map<string, { label: string; revenue: Decimal; orderCount: number }>();

  for (const order of completed) {
    const { key, label } = keyFn(order);
    const existing = byKey.get(key) ?? { label, revenue: new Decimal(0), orderCount: 0 };
    existing.revenue = existing.revenue.plus(order.total);
    existing.orderCount += 1;
    byKey.set(key, existing);
  }

  return [...byKey.entries()]
    .map(([key, value]) => ({ key, label: value.label, revenue: value.revenue.toNumber(), orderCount: value.orderCount }))
    .sort((a, b) => b.revenue - a.revenue);
}

/** Done-when (STEPS.md §15): this sums to summariseSales(orders).revenue exactly — same completed-orders filter, same `total` field. */
export function buildCounterBreakdown(orders: ReportOrder[]): BreakdownRow[] {
  return buildBreakdown(orders, (order) => ({
    key: order.counterId ?? "none",
    label: order.counterName ?? "No counter",
  }));
}

export function buildSourceBreakdown(orders: ReportOrder[]): BreakdownRow[] {
  return buildBreakdown(orders, (order) => ({ key: order.source, label: order.source }));
}

export function buildPaymentBreakdown(orders: ReportOrder[]): BreakdownRow[] {
  return buildBreakdown(orders, (order) => ({
    key: order.paymentMethod ?? "none",
    label: order.paymentMethod ?? "Not recorded",
  }));
}

/** A row's share of total revenue, e.g. "42.3%". Returns "0%" for a zero-revenue period rather than dividing by zero. */
export function formatSharePercent(rowRevenue: number, totalRevenue: number): string {
  if (totalRevenue === 0) return "0%";
  return `${new Decimal(rowRevenue).div(totalRevenue).times(100).toDecimalPlaces(1)}%`;
}

function csvField(value: string): string {
  return /["\n,]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Detail rows as CSV — quoted per-field so a comma in e.g. a counter name never shifts a column. */
export function buildDetailCsv(orders: ReportOrder[]): string {
  const header = ["Order number", "Date", "Counter", "Source", "Payment method", "Status", "Total"];
  const rows = orders.map((order) => [
    order.orderNumber,
    formatDate(order.createdAt, "datetime"),
    order.counterName ?? "—",
    order.source,
    order.paymentMethod ?? "—",
    order.status,
    formatLKR(order.total),
  ]);

  return [header, ...rows].map((row) => row.map(csvField).join(",")).join("\n");
}

/** Items-sold breakdown as CSV — quantity and revenue per plate. */
export function buildItemsSoldCsv(rows: ItemsSoldRow[]): string {
  const header = ["Item", "Quantity sold", "Revenue"];
  const body = rows.map((row) => [row.name, String(row.qty), formatLKR(row.revenue)]);
  return [header, ...body].map((row) => row.map(csvField).join(",")).join("\n");
}
