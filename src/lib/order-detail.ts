import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type CounterKind = Database["public"]["Enums"]["counter_kind"];

export type OrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  source: string;
  paymentMethod: string | null;
  subtotal: number;
  discountAmount: number;
  discountReason: string | null;
  total: number;
  createdAt: string;
  voidedAt: string | null;
  voidReason: string | null;
  counter: { name: string; kind: CounterKind } | null;
  items: {
    id: string;
    name: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    requiresKitchenPrep: boolean;
    notes: string | null;
  }[];
  printJobs: {
    id: string;
    target: Database["public"]["Enums"]["print_target"];
    status: Database["public"]["Enums"]["print_status"];
    createdAt: string;
  }[];
};

/**
 * Takes a Supabase client rather than constructing one, so the exact same
 * fetch+shape logic works from a Server Component (server client, for the
 * list page) and from the detail drawer (browser client — a client
 * component can't call the server-only query functions in lib/queries/*).
 */
export async function fetchOrderDetail(
  supabase: SupabaseClient<Database>,
  orderId: string,
): Promise<OrderDetail | null> {
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, source, payment_method, subtotal, discount_amount, discount_reason, total, created_at, voided_at, void_reason, counters(name, kind)",
    )
    .eq("id", orderId)
    .single();
  if (error || !order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("id, name_snapshot, qty, unit_price, line_total, requires_kitchen_prep, notes")
    .eq("order_id", orderId)
    .order("name_snapshot");

  const { data: printJobs } = await supabase
    .from("print_jobs")
    .select("id, target, status, created_at")
    .eq("order_id", orderId)
    .order("created_at");

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    source: order.source,
    paymentMethod: order.payment_method,
    subtotal: order.subtotal,
    discountAmount: order.discount_amount,
    discountReason: order.discount_reason,
    total: order.total,
    createdAt: order.created_at,
    voidedAt: order.voided_at,
    voidReason: order.void_reason,
    counter: order.counters,
    items: (items ?? []).map((item) => ({
      id: item.id,
      name: item.name_snapshot,
      qty: item.qty,
      unitPrice: item.unit_price,
      lineTotal: item.line_total,
      requiresKitchenPrep: item.requires_kitchen_prep,
      notes: item.notes,
    })),
    printJobs: (printJobs ?? []).map((job) => ({
      id: job.id,
      target: job.target,
      status: job.status,
      createdAt: job.created_at,
    })),
  };
}
