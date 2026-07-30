import { createClient } from "@/lib/supabase/server";

export type CustomerListRow = {
  id: string;
  name: string | null;
  phone_e164: string;
  loyalty_points: number;
  total_spend: number;
  order_count: number;
  is_priority: boolean;
  last_order_at: string | null;
};

export type CustomerFilter = {
  search?: string;
  priorityOnly?: boolean;
};

const LIST_COLUMNS =
  "id, name, phone_e164, loyalty_points, total_spend, order_count, is_priority, last_order_at";

/** Plain customer list, newest activity first. Priority filtering swaps to the derived view (getPriorityCustomers) instead. */
export async function getCustomers(filter: CustomerFilter): Promise<CustomerListRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select(LIST_COLUMNS)
    .order("last_order_at", { ascending: false, nullsFirst: false })
    .limit(200);

  if (filter.search) {
    const term = filter.search.trim();
    query = query.or(`name.ilike.%${term}%,phone_e164.ilike.%${term}%`);
  }
  if (filter.priorityOnly) query = query.eq("is_priority", true);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export type PriorityCustomerRow = CustomerListRow & {
  is_top_spender: boolean;
  recent_spend: number;
  priority_note: string | null;
};

/**
 * Manual `is_priority` flags OR derived top-10-by-recent-spend, from the
 * priority_customers view (ARCHITECTURE.md §Loyalty). Ordered so the list is
 * actually useful at a glance: the owner's own hand-picked regulars first,
 * then everyone else ranked by recent spend — the view computes a spend_rank
 * internally but doesn't order its output, so a plain select came back in
 * arbitrary (near enough to insertion) order.
 */
export async function getPriorityCustomers(search?: string): Promise<PriorityCustomerRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("priority_customers")
    .select(
      "id, name, phone_e164, loyalty_points, total_spend, order_count, is_priority, priority_note, last_order_at, is_top_spender, recent_spend",
    )
    .order("is_priority", { ascending: false })
    .order("recent_spend", { ascending: false });
  if (search) {
    const term = search.trim();
    query = query.or(`name.ilike.%${term}%,phone_e164.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  // The view's columns are all nullable in the generated types (views have no
  // NOT NULL info); every one is guaranteed non-null by the underlying table.
  return (data ?? []).map((row) => ({
    id: row.id!,
    name: row.name,
    phone_e164: row.phone_e164!,
    loyalty_points: row.loyalty_points!,
    total_spend: Number(row.total_spend),
    order_count: row.order_count!,
    is_priority: row.is_priority!,
    priority_note: row.priority_note,
    last_order_at: row.last_order_at,
    is_top_spender: row.is_top_spender!,
    recent_spend: Number(row.recent_spend),
  }));
}

export type CustomerDetail = {
  id: string;
  name: string | null;
  phone_e164: string;
  loyalty_points: number;
  is_priority: boolean;
  priority_note: string | null;
  total_spend: number;
  order_count: number;
  first_order_at: string | null;
  last_order_at: string | null;
};

export async function getCustomer(id: string): Promise<CustomerDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, name, phone_e164, loyalty_points, is_priority, priority_note, total_spend, order_count, first_order_at, last_order_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type CustomerOrderRow = {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
};

/** A customer's order history, newest first — for the detail drawer. */
export async function getCustomerOrders(customerId: string): Promise<CustomerOrderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, total, status, created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export type LoyaltyLedgerRow = {
  id: string;
  order_id: string | null;
  points_earned: number;
  points_redeemed: number;
  balance_after: number;
  created_at: string;
  order_number: string | null;
};

/** A customer's points ledger, newest first — for the detail drawer. */
export async function getCustomerLoyaltyLedger(customerId: string): Promise<LoyaltyLedgerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_transactions")
    .select("id, order_id, points_earned, points_redeemed, balance_after, created_at, orders(order_number)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data.map(({ orders, ...row }) => ({ ...row, order_number: orders?.order_number ?? null }));
}

export type LoyaltySettings = {
  earnPointsPerLkr: number;
  redeemLkrPerPoint: number;
};

/** Loyalty rate settings (ARCHITECTURE.md §Loyalty — "rates are settings, not constants"). */
export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["loyalty.earn_points_per_lkr", "loyalty.redeem_lkr_per_point"]);
  if (error) throw error;

  const byKey = new Map(data.map((row) => [row.key, row.value]));
  return {
    earnPointsPerLkr: Number(byKey.get("loyalty.earn_points_per_lkr") ?? 1),
    redeemLkrPerPoint: Number(byKey.get("loyalty.redeem_lkr_per_point") ?? 0.01),
  };
}
