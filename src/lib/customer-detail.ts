import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type CustomerDetailData = {
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

export type CustomerOrderRow = {
  id: string;
  orderNumber: string;
  total: number;
  status: Database["public"]["Enums"]["order_status"];
  createdAt: string;
};

export type LoyaltyLedgerRow = {
  id: string;
  pointsEarned: number;
  pointsRedeemed: number;
  balanceAfter: number;
  createdAt: string;
  orderNumber: string | null;
};

/**
 * Takes a Supabase client rather than constructing one — the customer detail
 * drawer is a client component (same reasoning as inventory-detail.ts /
 * order-detail.ts) and opens keyed only by id, so it fetches its own data
 * rather than being handed a server-fetched row.
 */
export async function fetchCustomerDetail(
  supabase: SupabaseClient<Database>,
  customerId: string,
): Promise<{ customer: CustomerDetailData | null; orders: CustomerOrderRow[]; ledger: LoyaltyLedgerRow[] }> {
  const [customerRes, ordersRes, ledgerRes] = await Promise.all([
    supabase
      .from("customers")
      .select(
        "id, name, phone_e164, loyalty_points, is_priority, priority_note, total_spend, order_count, first_order_at, last_order_at",
      )
      .eq("id", customerId)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("id, order_number, total, status, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("loyalty_transactions")
      .select("id, points_earned, points_redeemed, balance_after, created_at, orders(order_number)")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const customer = customerRes.data
    ? { ...customerRes.data, total_spend: Number(customerRes.data.total_spend) }
    : null;

  const orders = (ordersRes.data ?? []).map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    total: Number(row.total),
    status: row.status,
    createdAt: row.created_at,
  }));

  const ledger = (ledgerRes.data ?? []).map((row) => ({
    id: row.id,
    pointsEarned: row.points_earned,
    pointsRedeemed: row.points_redeemed,
    balanceAfter: row.balance_after,
    createdAt: row.created_at,
    orderNumber: row.orders?.order_number ?? null,
  }));

  return { customer, orders, ledger };
}
