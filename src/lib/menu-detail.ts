import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { RecipeLine } from "@/lib/queries/menu";

/**
 * Takes a Supabase client rather than constructing one — the menu item detail
 * drawer is a client component and can't call lib/queries/* (server-only
 * client). recipe_items is owner/manager-only (RLS), so this comes back
 * empty for a staff caller rather than erroring.
 */
export async function fetchMenuItemRecipe(
  supabase: SupabaseClient<Database>,
  menuItemId: string,
): Promise<RecipeLine[]> {
  const { data, error } = await supabase
    .from("recipe_items")
    .select("inventory_item_id, qty, inventory_items(name, base_unit)")
    .eq("menu_item_id", menuItemId);

  if (error || !data) return [];

  return data.map(({ inventory_items, ...row }) => ({
    ...row,
    // inventory_item_id is a NOT NULL FK (restrict on delete), so the embed always resolves.
    inventory_item: { name: inventory_items!.name, base_unit: inventory_items!.base_unit },
  }));
}
