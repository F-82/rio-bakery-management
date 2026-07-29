import { createClient } from "@/lib/supabase/server";
import { colomboToday } from "@/lib/dashboard";
import type { Database } from "@/types/database";

type TaxCategory = Database["public"]["Enums"]["tax_category"];

export type MenuCategory = Pick<
  Database["public"]["Tables"]["categories"]["Row"],
  "id" | "name" | "sort_order"
>;

export type PosMenuItem = Pick<
  Database["public"]["Tables"]["menu_items"]["Row"],
  "id" | "name" | "price" | "category_id" | "requires_kitchen_prep" | "tax_category" | "image_url"
>;

export type MenuListRow = {
  id: string;
  name: string;
  category_id: string | null;
  category: { name: string } | null;
  price: number;
  image_url: string | null;
  available: boolean;
  requires_kitchen_prep: boolean;
  tax_category: TaxCategory;
};

export type MenuItemFilter = {
  categoryId?: string;
  search?: string;
  availableOnly?: boolean;
};

export type RecipeInventoryOption = Pick<
  Database["public"]["Tables"]["inventory_items"]["Row"],
  "id" | "name" | "base_unit"
>;

export type RecipeLine = {
  inventory_item_id: string;
  qty: number;
  inventory_item: { name: string; base_unit: string };
};

/** Menu-scoped categories, ordered for the category tab bar. */
export async function getMenuCategories(): Promise<MenuCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, sort_order")
    .eq("scope", "menu")
    .order("sort_order");

  if (error) throw error;
  return data;
}

/** Available menu items for the POS tile grid, ordered for a stable grid layout. */
export async function getMenuItemsForPos(): Promise<PosMenuItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, price, category_id, requires_kitchen_prep, tax_category, image_url")
    .eq("available", true)
    .order("sort_order");

  if (error) throw error;
  return data;
}

const LIST_COLUMNS =
  "id, name, category_id, categories(name), price, image_url, available, requires_kitchen_prep, tax_category";

/** Menu items for the management list, newest catalog controls first. */
export async function getMenuItems(filter: MenuItemFilter): Promise<MenuListRow[]> {
  const supabase = await createClient();
  let query = supabase.from("menu_items").select(LIST_COLUMNS).order("sort_order");

  if (filter.categoryId) query = query.eq("category_id", filter.categoryId);
  if (filter.search) query = query.ilike("name", `%${filter.search}%`);
  if (filter.availableOnly) query = query.eq("available", true);

  const { data, error } = await query;
  if (error) throw error;

  return data.map(({ categories, ...row }) => ({ ...row, category: categories }));
}

export type SoldTodayMap = Record<string, number>;

/**
 * Today's completed sales per menu item (Colombo day) — feeds the Menu
 * page's "sold today" count (client request: a daily per-item sold
 * count, not a production/stocktake entry). Aggregated here rather than
 * via an RPC since it's a single small `group by` over one day's rows.
 */
export async function getSoldTodayByMenuItem(): Promise<SoldTodayMap> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("menu_item_id, qty, orders!inner(status, order_day)")
    .eq("orders.status", "completed")
    .eq("orders.order_day", colomboToday());

  if (error) throw error;

  const totals: SoldTodayMap = {};
  for (const row of data) {
    if (!row.menu_item_id) continue;
    totals[row.menu_item_id] = (totals[row.menu_item_id] ?? 0) + row.qty;
  }
  return totals;
}

/** Active inventory items available to link into a recipe, for the recipe builder's picker. */
export async function getInventoryItemsForRecipe(): Promise<RecipeInventoryOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, name, base_unit")
    .eq("active", true)
    .order("name");

  if (error) throw error;
  return data;
}

/** A menu item's recipe lines, joined with the ingredient name and unit for display. */
export async function getMenuItemRecipe(menuItemId: string): Promise<RecipeLine[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipe_items")
    .select("inventory_item_id, qty, inventory_items(name, base_unit)")
    .eq("menu_item_id", menuItemId);

  if (error) throw error;

  return data.map(({ inventory_items, ...row }) => ({
    ...row,
    // inventory_item_id is a NOT NULL FK (restrict on delete), so the embed always resolves.
    inventory_item: { name: inventory_items!.name, base_unit: inventory_items!.base_unit },
  }));
}
