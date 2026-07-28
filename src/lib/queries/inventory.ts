import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type StockType = Database["public"]["Enums"]["stock_type"];

export type InventoryCategory = Pick<
  Database["public"]["Tables"]["categories"]["Row"],
  "id" | "name" | "sort_order"
>;

export type InventoryListRow = {
  id: string;
  name: string;
  category_id: string | null;
  category: { name: string } | null;
  stock_type: StockType;
  base_unit: string;
  qty_on_hand: number;
  low_stock_threshold: number;
  unit_cost: number;
  barcode: string | null;
  active: boolean;
};

export type InventoryFilter = {
  lowStockOnly?: boolean;
  categoryId?: string;
  search?: string;
};

const LIST_COLUMNS =
  "id, name, category_id, categories(name), stock_type, base_unit, qty_on_hand, low_stock_threshold, unit_cost, barcode, active";

/** Inventory-scoped categories, ordered for the filter select. */
export async function getInventoryCategories(): Promise<InventoryCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, sort_order")
    .eq("scope", "inventory")
    .order("sort_order");

  if (error) throw error;
  return data;
}

/** qty_on_hand <= low_stock_threshold — mirrors LowStockBadge's own condition. PostgREST filters compare a column to a literal, not another column, so this is applied in JS rather than as a `.filter()`. */
function isLowStock(row: { qty_on_hand: number; low_stock_threshold: number }): boolean {
  return row.qty_on_hand <= row.low_stock_threshold;
}

export async function getInventoryItems(filter: InventoryFilter): Promise<InventoryListRow[]> {
  const supabase = await createClient();
  let query = supabase.from("inventory_items").select(LIST_COLUMNS).order("name");

  if (filter.categoryId) query = query.eq("category_id", filter.categoryId);
  if (filter.search) query = query.ilike("name", `%${filter.search}%`);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data.map(({ categories, ...row }) => ({ ...row, category: categories }));
  return filter.lowStockOnly ? rows.filter(isLowStock) : rows;
}

/** Count of items at/below their low-stock threshold — feeds the Inventory nav badge. */
export async function getLowStockCount(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("inventory_items").select("qty_on_hand, low_stock_threshold");

  if (error) throw error;
  return data.filter(isLowStock).length;
}

/** Raw stock levels for every item — feeds the dashboard's realtime low-stock count (lib/dashboard.ts's countLowStock). */
export async function getStockLevels(): Promise<{ id: string; qtyOnHand: number; lowStockThreshold: number }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("inventory_items").select("id, qty_on_hand, low_stock_threshold");

  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    qtyOnHand: row.qty_on_hand,
    lowStockThreshold: row.low_stock_threshold,
  }));
}
