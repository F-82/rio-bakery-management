import { Decimal } from "decimal.js";
import { createClient } from "@/lib/supabase/server";
import { colomboToday } from "@/lib/dashboard";
import type { DashboardOrder, DashboardPrintJob } from "@/lib/dashboard";

/** Today's orders (Colombo day) — feeds the sales panel, the 2x2 grid and their realtime patch. */
export async function getTodaysOrders(): Promise<DashboardOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, total, order_number, order_day")
    .eq("order_day", colomboToday());

  if (error) throw error;
  return data.map(({ order_number, order_day, ...row }) => ({
    ...row,
    orderNumber: order_number,
    orderDay: order_day,
  }));
}

/**
 * Print jobs for today's orders only — an unresolved failure from a prior
 * day belongs to that day's Orders history (step 09's reprint UI), not this
 * dashboard.
 */
export async function getTodaysPrintJobs(orderIds: string[]): Promise<DashboardPrintJob[]> {
  if (orderIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("print_jobs")
    .select("id, order_id, target, status, last_error, created_at")
    .in("order_id", orderIds)
    .order("created_at");

  if (error) throw error;
  return data.map(({ order_id, last_error, created_at, ...row }) => ({
    ...row,
    orderId: order_id,
    lastError: last_error,
    createdAt: created_at,
  }));
}

/** Today's recorded expenses (Colombo day) — the other half of the net profit split. */
export async function getTodaysExpenseTotal(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("expenses").select("amount").eq("date", colomboToday());

  if (error) throw error;
  return data.reduce((sum, row) => sum.plus(row.amount), new Decimal(0)).toNumber();
}
