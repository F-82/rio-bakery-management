import { Decimal } from "decimal.js";
import { colomboToday } from "@/lib/dashboard";
import type { Database } from "@/types/database";

/**
 * Pure finance math, kept separate from lib/queries/finance.ts so the shape
 * mirrors lib/dashboard.ts (step 13) — one module of testable functions, one
 * module of Supabase reads, no drift between what's tested and what runs.
 */

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export type FinanceOrder = {
  status: OrderStatus;
  total: number;
  orderDay: string;
};

export type FinancePeriod = "today" | "week" | "month" | "quarter" | "year";

export const FINANCE_PERIODS: { value: FinancePeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "year", label: "This year" },
];

export type DateRange = { from: string; to: string };

/** Same fixed UTC+05:30 offset technique as colomboToday() — Sri Lanka has no DST. */
function colomboNow(): Date {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000);
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Every preset runs from the period's start to today, never into the
 * future — a still-in-progress month shows what's happened so far, the same
 * convention as any sales dashboard.
 */
export function getPeriodRange(period: FinancePeriod): DateRange {
  const now = colomboNow();
  const to = colomboToday();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();

  switch (period) {
    case "today":
      return { from: to, to };
    case "week": {
      const dayOfWeek = now.getUTCDay();
      const diffToMonday = (dayOfWeek + 6) % 7;
      const monday = new Date(Date.UTC(year, month, day - diffToMonday));
      return { from: toDateString(monday), to };
    }
    case "month":
      return { from: toDateString(new Date(Date.UTC(year, month, 1))), to };
    case "quarter": {
      const quarterStartMonth = Math.floor(month / 3) * 3;
      return { from: toDateString(new Date(Date.UTC(year, quarterStartMonth, 1))), to };
    }
    case "year":
      return { from: toDateString(new Date(Date.UTC(year, 0, 1))), to };
  }
}

export type FinanceSummary = {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalOrders: number;
};

/** Income counts completed orders only — an open order hasn't been paid for yet (same rule as the dashboard). */
export function summariseFinance(orders: FinanceOrder[], expenseAmounts: number[]): FinanceSummary {
  const totalIncome = orders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum.plus(order.total), new Decimal(0));
  const totalExpenses = expenseAmounts.reduce((sum, amount) => sum.plus(amount), new Decimal(0));

  return {
    totalIncome: totalIncome.toNumber(),
    totalExpenses: totalExpenses.toNumber(),
    netProfit: totalIncome.minus(totalExpenses).toNumber(),
    totalOrders: orders.length,
  };
}

export type RevenueByDay = { date: string; revenue: number };

/** One point per calendar day in the range, zero-filled — a day with no completed orders is still a bar, not a gap. */
export function buildRevenueByDay(orders: FinanceOrder[], range: DateRange): RevenueByDay[] {
  const byDay = new Map<string, Decimal>();
  for (const order of orders) {
    if (order.status !== "completed") continue;
    byDay.set(order.orderDay, (byDay.get(order.orderDay) ?? new Decimal(0)).plus(order.total));
  }

  const days: RevenueByDay[] = [];
  const cursor = new Date(`${range.from}T00:00:00Z`);
  const end = new Date(`${range.to}T00:00:00Z`);
  while (cursor <= end) {
    const date = toDateString(cursor);
    days.push({ date, revenue: (byDay.get(date) ?? new Decimal(0)).toNumber() });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
