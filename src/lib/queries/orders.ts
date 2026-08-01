import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { aggregateItemsSold, type ItemsSoldRow, type SoldLine } from "@/lib/items-sold";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type CounterKind = Database["public"]["Enums"]["counter_kind"];

export type OrderListRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  source: string;
  payment_method: string | null;
  total: number;
  created_at: string;
  order_day: string;
  counter_id: string | null;
  counter: { name: string; kind: CounterKind } | null;
};

export type OrdersFilter = {
  tab: "active" | "archived";
  /** Only meaningful within the active tab — archived is always just 'voided'. */
  status?: Extract<OrderStatus, "open" | "completed">;
  counterId?: string;
  source?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  /** Order number only — phone/name search needs the customers table (step 12). */
  search?: string;
};

const LIST_COLUMNS = "id, order_number, status, source, payment_method, total, created_at, order_day, counter_id, counters(name, kind)";

export async function getOrders(filter: OrdersFilter): Promise<OrderListRow[]> {
  const supabase = await createClient();
  let query = supabase.from("orders").select(LIST_COLUMNS).order("created_at", { ascending: false }).limit(200);

  if (filter.tab === "active") {
    query = query.in("status", ["open", "completed"]);
    if (filter.status) query = query.eq("status", filter.status);
  } else {
    query = query.eq("status", "voided");
  }

  if (filter.counterId) query = query.eq("counter_id", filter.counterId);
  if (filter.source) query = query.eq("source", filter.source);
  if (filter.paymentMethod) query = query.eq("payment_method", filter.paymentMethod);
  if (filter.dateFrom) query = query.gte("order_day", filter.dateFrom);
  if (filter.dateTo) query = query.lte("order_day", filter.dateTo);
  if (filter.search) query = query.ilike("order_number", `%${filter.search}%`);

  const { data, error } = await query;
  if (error) throw error;

  return data.map(({ counters, ...row }) => ({ ...row, counter: counters }));
}

/**
 * "How many of each plate were sold" for the Orders page — aggregates
 * order_items over the currently filtered orders (inner join to orders so the
 * filters apply to the parent). Completed orders only — same rule as the sales
 * report's By-item breakdown, so the two never disagree: an open order hasn't
 * been paid for and a voided one was reversed, so neither counts as sold. An
 * explicit "open" status filter therefore has nothing sold to show.
 */
export async function getItemsSold(filter: OrdersFilter): Promise<ItemsSoldRow[]> {
  if (filter.tab !== "active" || filter.status === "open") return [];

  const supabase = await createClient();
  let query = supabase
    .from("order_items")
    .select(
      "name_snapshot, qty, line_total, orders!inner(status, order_day, counter_id, source, payment_method, order_number)",
    )
    // Bakery-scale ceiling: comfortably covers a busy day/week; a huge range
    // would truncate, matching the list's own 200-order cap philosophy.
    .limit(5000)
    .eq("orders.status", "completed");

  if (filter.counterId) query = query.eq("orders.counter_id", filter.counterId);
  if (filter.source) query = query.eq("orders.source", filter.source);
  if (filter.paymentMethod) query = query.eq("orders.payment_method", filter.paymentMethod);
  if (filter.dateFrom) query = query.gte("orders.order_day", filter.dateFrom);
  if (filter.dateTo) query = query.lte("orders.order_day", filter.dateTo);
  if (filter.search) query = query.ilike("orders.order_number", `%${filter.search}%`);

  const { data, error } = await query;
  if (error) throw error;

  const lines: SoldLine[] = data.map((row) => ({
    name: row.name_snapshot,
    qty: row.qty,
    lineTotal: row.line_total,
  }));
  return aggregateItemsSold(lines);
}

/** Distinct order sources seen so far. The full source list is an open client question (STEPS.md blocker #4) — this reflects real data, not an invented enum. */
export async function getOrderSources(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select("source").limit(1000);
  if (error) throw error;
  return [...new Set(data.map((row) => row.source))].sort();
}
