"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profile";
import type { Database } from "@/types/database";

type StockType = Database["public"]["Enums"]["stock_type"];

export type InventoryItemInput = {
  name: string;
  categoryId: string | null;
  stockType: StockType;
  baseUnit: string;
  lowStockThreshold: number;
  unitCost: number;
  barcode: string | null;
  active: boolean;
};

export type InventoryItemResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/** Single-row insert under RLS's owner/manager inventory_items_write policy — not a multi-step write, so a plain action (no RPC) is enough. */
export async function createInventoryItem(input: InventoryItemInput): Promise<InventoryItemResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "not authenticated" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .insert({
      business_id: profile.business_id,
      name: input.name,
      category_id: input.categoryId,
      stock_type: input.stockType,
      base_unit: input.baseUnit,
      low_stock_threshold: input.lowStockThreshold,
      unit_cost: input.unitCost,
      barcode: input.barcode,
      active: input.active,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function updateInventoryItem(
  id: string,
  input: InventoryItemInput,
): Promise<InventoryItemResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_items")
    .update({
      name: input.name,
      category_id: input.categoryId,
      stock_type: input.stockType,
      base_unit: input.baseUnit,
      low_stock_threshold: input.lowStockThreshold,
      unit_cost: input.unitCost,
      barcode: input.barcode,
      active: input.active,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, id };
}

export type StockMovementReason = "manual_adjustment" | "wastage" | "purchase" | "stocktake";

export type StockMovementInput =
  | { reason: "manual_adjustment"; inventoryItemId: string; delta: number; note?: string }
  | { reason: "wastage"; inventoryItemId: string; qty: number; note?: string }
  | { reason: "purchase"; inventoryItemId: string; qty: number; note?: string }
  | { reason: "stocktake"; inventoryItemId: string; countedQty: number; note?: string };

export type StockMovementResult =
  | { ok: true; delta: number; qtyOnHand: number }
  | { ok: false; error: string };

/**
 * Wraps record_stock_movement (see
 * supabase/migrations/20260727120000_inventory_stock_entry.sql). Never a
 * direct qty_on_hand write — every manual entry goes through this RPC, which
 * is the only INSERT path into stock_movements for a non-order write.
 */
export async function recordStockMovement(input: StockMovementInput): Promise<StockMovementResult> {
  const supabase = await createClient();

  const payload: Record<string, string | number | null> = {
    inventory_item_id: input.inventoryItemId,
    reason: input.reason,
    note: input.note || null,
  };
  if (input.reason === "manual_adjustment") payload.delta = input.delta;
  else if (input.reason === "stocktake") payload.counted_qty = input.countedQty;
  else payload.qty = input.qty;

  const { data, error } = await supabase.rpc("record_stock_movement", { payload });
  if (error) return { ok: false, error: error.message };

  const result = data as { delta: number; qty_on_hand: number };
  return { ok: true, delta: result.delta, qtyOnHand: result.qty_on_hand };
}
