import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

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

const LIST_COLUMNS = "id, order_number, status, source, payment_method, total, created_at, counter_id, counters(name, kind)";

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
  if (filter.dateFrom) query = query.gte("created_at", `${filter.dateFrom}T00:00:00`);
  if (filter.dateTo) query = query.lte("created_at", `${filter.dateTo}T23:59:59`);
  if (filter.search) query = query.ilike("order_number", `%${filter.search}%`);

  const { data, error } = await query;
  if (error) throw error;

  return data.map(({ counters, ...row }) => ({ ...row, counter: counters }));
}

/** Distinct order sources seen so far. The full source list is an open client question (STEPS.md blocker #4) — this reflects real data, not an invented enum. */
export async function getOrderSources(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select("source").limit(1000);
  if (error) throw error;
  return [...new Set(data.map((row) => row.source))].sort();
}
