"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profile";
import type { Database } from "@/types/database";

type TaxCategory = Database["public"]["Enums"]["tax_category"];

export type MenuItemInput = {
  name: string;
  categoryId: string | null;
  price: number;
  imageUrl: string | null;
  available: boolean;
  requiresKitchenPrep: boolean;
  taxCategory: TaxCategory;
};

export type MenuItemResult = { ok: true; id: string } | { ok: false; error: string };

/** Single-row insert under RLS's owner/manager menu_items_write policy. */
export async function createMenuItem(input: MenuItemInput): Promise<MenuItemResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "not authenticated" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      business_id: profile.business_id,
      name: input.name,
      category_id: input.categoryId,
      price: input.price,
      image_url: input.imageUrl,
      available: input.available,
      requires_kitchen_prep: input.requiresKitchenPrep,
      tax_category: input.taxCategory,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function updateMenuItem(id: string, input: MenuItemInput): Promise<MenuItemResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({
      name: input.name,
      category_id: input.categoryId,
      price: input.price,
      image_url: input.imageUrl,
      available: input.available,
      requires_kitchen_prep: input.requiresKitchenPrep,
      tax_category: input.taxCategory,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, id };
}

/** Quick toggle from the list row — a partial update, not the full edit form. */
export async function setMenuItemAvailability(id: string, available: boolean): Promise<MenuItemResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").update({ available }).eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, id };
}

export type RecipeLineInput = { inventoryItemId: string; qty: number };

export type RecipeResult = { ok: true } | { ok: false; error: string };

/**
 * Replaces a menu item's full recipe in one call — delete then insert, not a
 * diff. Recipe builder edits are infrequent, low-line-count, and owner/manager
 * only, so there's no concurrency case worth a diff against the previous set.
 */
export async function replaceMenuItemRecipe(
  menuItemId: string,
  lines: RecipeLineInput[],
): Promise<RecipeResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "not authenticated" };

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("recipe_items")
    .delete()
    .eq("menu_item_id", menuItemId);
  if (deleteError) return { ok: false, error: deleteError.message };

  if (lines.length === 0) return { ok: true };

  const { error: insertError } = await supabase.from("recipe_items").insert(
    lines.map((line) => ({
      business_id: profile.business_id,
      menu_item_id: menuItemId,
      inventory_item_id: line.inventoryItemId,
      qty: line.qty,
    })),
  );
  if (insertError) return { ok: false, error: insertError.message };

  return { ok: true };
}
