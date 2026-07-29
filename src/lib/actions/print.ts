"use server";

import { createClient } from "@/lib/supabase/server";
import type { OrderPrintJob } from "./orders";

export type ReprintResult =
  | { ok: true; printJobs: OrderPrintJob[] }
  | { ok: false; error: string };

/**
 * Reprint inserts a new row against the same order; it never mutates the old
 * one. Returns the order's full print_jobs list so the caller can just
 * replace its local state instead of fetching separately (fetching would
 * need the server Supabase client, which a client component can't reach).
 */
export async function reprintJob(printJobId: string): Promise<ReprintResult> {
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("print_jobs")
    .select("business_id, order_id, target, payload")
    .eq("id", printJobId)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: fetchError?.message ?? "Print job not found" };
  }

  const { error: insertError } = await supabase.from("print_jobs").insert({
    business_id: existing.business_id,
    order_id: existing.order_id,
    target: existing.target,
    payload: existing.payload,
  });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  const { data: printJobs } = await supabase
    .from("print_jobs")
    .select("id, target, status, payload")
    .eq("order_id", existing.order_id)
    .order("created_at");

  return { ok: true, printJobs: printJobs ?? [] };
}
