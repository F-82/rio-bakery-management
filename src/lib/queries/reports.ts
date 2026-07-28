import { createClient } from "@/lib/supabase/server";
import type { ReportOrder } from "@/lib/reports";

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
