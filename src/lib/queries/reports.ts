import { createClient } from "@/lib/supabase/server";
import type { ReportOrder } from "@/lib/reports";
import { aggregateItemsSold, type ItemsSoldRow, type SoldLine } from "@/lib/items-sold";

const REPORT_COLUMNS =
  "id, order_number, status, source, payment_method, total, created_at, counter_id, counters(name, kind)";

/** Orders in [from, to] (Colombo day, inclusive) — feeds the sales report's cards, breakdowns and detail table. */
export async function getOrdersForReport(from: string, to: string): Promise<ReportOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(REPORT_COLUMNS)
    .gte("order_day", from)
    .lte("order_day", to)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map(({ counters, ...row }) => ({
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    total: row.total,
    createdAt: row.created_at,
    counterId: row.counter_id,
    counterName: counters?.name ?? null,
    counterKind: counters?.kind ?? null,
    source: row.source,
    paymentMethod: row.payment_method,
  }));
}

/**
 * Items sold in [from, to] for the sales report's By-item breakdown. Only
 * completed orders count — same rule as summariseSales' revenue and every
 * breakdown on that page, so the quantities line up with the revenue cards.
 */
export async function getItemsSoldForReport(from: string, to: string): Promise<ItemsSoldRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("name_snapshot, qty, line_total, orders!inner(status, order_day)")
    .eq("orders.status", "completed")
    .gte("orders.order_day", from)
    .lte("orders.order_day", to)
    .limit(10000);

  if (error) throw error;

  const lines: SoldLine[] = data.map((row) => ({
    name: row.name_snapshot,
    qty: row.qty,
    lineTotal: row.line_total,
  }));
  return aggregateItemsSold(lines);
}
