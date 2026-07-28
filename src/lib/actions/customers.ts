"use server";

import { createClient } from "@/lib/supabase/server";
import { normalisePhone } from "@/lib/format";

export type CustomerResult =
  | { ok: true; id: string; name: string | null; phone_e164: string; loyalty_points: number; existed: boolean }
  | { ok: false; error: string };

/**
 * Normalises the phone (the trap in STEPS.md §12) then calls
 * find_or_create_customer, which is itself idempotent on (business_id,
 * phone_e164) — three raw formats of the same number all resolve here to one
 * row, never a thrown unique-violation.
 */
export async function findOrCreateCustomer(input: { name?: string; phone: string }): Promise<CustomerResult> {
  const phone = normalisePhone(input.phone);
  if (!phone) return { ok: false, error: "Enter a valid Sri Lankan phone number." };

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("customers")
    .select("id")
    .eq("phone_e164", phone)
    .maybeSingle();

  const { data, error } = await supabase.rpc("find_or_create_customer", {
    payload: { name: input.name?.trim() || null, phone_e164: phone },
  });

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "customer lookup failed" };
  return {
    ok: true,
    id: data.id,
    name: data.name,
    phone_e164: data.phone_e164,
    loyalty_points: data.loyalty_points,
    existed: before !== null,
  };
}

export type PriorityResult = { ok: true } | { ok: false; error: string };

/** Owner/manager only — enforced by customers_owner_mgr_all RLS, this is a plain update. */
export async function setCustomerPriority(
  id: string,
  isPriority: boolean,
  note: string | null,
): Promise<PriorityResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ is_priority: isPriority, priority_note: isPriority ? note : null })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
