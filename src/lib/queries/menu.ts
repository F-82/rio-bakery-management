import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type MenuCategory = Pick<
  Database["public"]["Tables"]["categories"]["Row"],
  "id" | "name" | "sort_order"
>;

export type PosMenuItem = Pick<
  Database["public"]["Tables"]["menu_items"]["Row"],
  "id" | "name" | "price" | "category_id" | "requires_kitchen_prep" | "tax_category" | "image_url"
>;

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
