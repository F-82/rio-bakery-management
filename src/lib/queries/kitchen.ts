import { createClient } from "@/lib/supabase/server";
import { colomboToday } from "@/lib/dashboard";

export type KitchenOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  source: string;
  prepStatus: "pending" | "prepared";
  preparedAt: string | null;
  counter: { name: string } | null;
  items: Array<{
    id: string;
    name: string;
    qty: number;
    notes: string | null;
  }>;
};

export async function getTodaysKitchenOrders(): Promise<KitchenOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, created_at, source, prep_status, prepared_at, counters(name), order_items!inner(id, name_snapshot, qty, notes, requires_kitchen_prep)",
    )
    .eq("order_day", colomboToday())
    .neq("prep_status", "not_required")
    .eq("order_items.requires_kitchen_prep", true)
    .order("created_at");

  if (error) throw error;

  return data.map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    createdAt: order.created_at,
    source: order.source,
    prepStatus: order.prep_status as "pending" | "prepared",
    preparedAt: order.prepared_at,
    counter: order.counters,
    items: order.order_items.map((item) => ({
      id: item.id,
      name: item.name_snapshot,
      qty: item.qty,
      notes: item.notes,
    })),
  }));
}
