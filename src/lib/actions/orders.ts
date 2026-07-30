"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CreateOrderLine = {
  menuItemId: string;
  qty: number;
  notes?: string;
};

export type CreateOrderInput = {
  counterId: string;
  paymentMethod: "cash" | "card";
  source?: string;
  customerId?: string;
  /** LKR change kept as loyalty points instead of handed back as cash — needs a customerId. */
  changeToPointsLkr?: number;
  /** Loyalty points the customer is spending as a discount on this order — needs a customerId. */
  redeemPoints?: number;
  items: CreateOrderLine[];
};

export type LowStockWarning = {
  inventory_item_id: string;
  name: string;
  qty_on_hand: number;
  low_stock_threshold: number;
  negative: boolean;
};

export type OrderPrintJob = {
  id: string;
  target: Database["public"]["Enums"]["print_target"];
  status: Database["public"]["Enums"]["print_status"];
  payload: Database["public"]["Tables"]["print_jobs"]["Row"]["payload"];
};

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      total: number;
      kitchenTicket: boolean;
      lowStockWarnings: LowStockWarning[];
      printJobs: OrderPrintJob[];
    }
  | { ok: false; error: string };

/**
 * Wraps create_order (see supabase/migrations/20260726193504_orders_rpc.sql).
 * The RPC computes every price server-side from menu_items.price — the
 * payload here carries only menu_item_id/qty/notes, never a price. Also
 * fetches the print_jobs the RPC just queued, so the success screen has
 * something to show without a second client/server round trip (queries in
 * lib/queries/* use the server Supabase client and can't be called from a
 * client component directly).
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_order", {
    payload: {
      counter_id: input.counterId,
      payment_method: input.paymentMethod,
      source: input.source,
      customer_id: input.customerId,
      change_to_points_lkr: input.customerId ? input.changeToPointsLkr : undefined,
      redeem_points: input.customerId ? input.redeemPoints : undefined,
      items: input.items.map((line) => ({
        menu_item_id: line.menuItemId,
        qty: line.qty,
        notes: line.notes || null,
      })),
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const result = data as {
    order_id: string;
    order_number: string;
    total: number;
    kitchen_ticket: boolean;
    low_stock_warnings: LowStockWarning[];
  };

  const { data: printJobs } = await supabase
    .from("print_jobs")
    .select("id, target, status, payload")
    .eq("order_id", result.order_id)
    .order("created_at");

  return {
    ok: true,
    orderId: result.order_id,
    orderNumber: result.order_number,
    total: result.total,
    kitchenTicket: result.kitchen_ticket,
    lowStockWarnings: result.low_stock_warnings,
    printJobs: printJobs ?? [],
  };
}

export type VoidOrderResult = { ok: true } | { ok: false; error: string };

/**
 * Wraps void_order (owner/manager only — enforced inside the RPC itself,
 * not just by hiding the button; see 20260727054744_fix_void_order_role_check.sql).
 * Never a hard delete: flips status to voided and reverses stock movements.
 */
export async function voidOrder(orderId: string, reason: string): Promise<VoidOrderResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("void_order", { p_order_id: orderId, p_reason: reason });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
