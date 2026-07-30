"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfileContext } from "@/lib/queries/profile";

export type PrepareOrderResult = { ok: true } | { ok: false; error: string };

export async function markOrderPrepared(orderId: string): Promise<PrepareOrderResult> {
  const context = await getCurrentProfileContext();
  const canPrepare =
    context?.profile.role === "owner" ||
    context?.profile.role === "manager" ||
    (context?.profile.role === "staff" && context.counter?.kind === "hot_plate");

  if (!canPrepare) return { ok: false, error: "Not authorized to prepare orders." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_order_prepared", { p_order_id: orderId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
