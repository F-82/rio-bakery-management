import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type StockReason = Database["public"]["Enums"]["stock_reason"];

export type StockMovementRow = {
  id: string;
  delta: number;
  reason: StockReason;
  note: string | null;
  createdAt: string;
  orderNumber: string | null;
};

/**
 * Takes a Supabase client rather than constructing one — the item detail
 * drawer is a client component and can't call lib/queries/* (server-only
 * client). stock_movements is owner/manager-read-only (RLS), so this comes
 * back empty for a staff caller rather than erroring.
 */
export async function fetchStockMovements(
  supabase: SupabaseClient<Database>,
  inventoryItemId: string,
): Promise<StockMovementRow[]> {
  const { data, error } = await supabase
    .from("stock_movements")
    .select("id, delta, reason, note, created_at, orders(order_number)")
    .eq("inventory_item_id", inventoryItemId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    delta: row.delta,
    reason: row.reason,
    note: row.note,
    createdAt: row.created_at,
    orderNumber: row.orders?.order_number ?? null,
  }));
}
