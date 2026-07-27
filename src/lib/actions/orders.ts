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
    .select("id, target, status")
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
