"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profile";

export type ExpenseInput = {
  date: string;
  category: string;
  amount: number;
  note: string | null;
  isTaxDeductible: boolean;
  /** Storage path in the private "receipts" bucket, not a URL — see lib/receipt-upload.ts. */
  receiptPath: string | null;
};

export type ExpenseResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Owner-only (expenses_write RLS, ARCHITECTURE.md §RLS — manager is
 * read-only on expenses, staff has none). Checked here too so the form
 * fails with a clear message instead of a bare RLS-denied insert error.
 */
export async function createExpense(input: ExpenseInput): Promise<ExpenseResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "not authenticated" };
  if (profile.role !== "owner") return { ok: false, error: "Only the owner can record expenses." };
  if (!input.category.trim()) return { ok: false, error: "Category is required." };
  if (!input.date) return { ok: false, error: "Date is required." };
  if (!(input.amount >= 0)) return { ok: false, error: "Amount cannot be negative." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      business_id: profile.business_id,
      date: input.date,
      category: input.category.trim(),
      amount: input.amount,
      note: input.note,
      is_tax_deductible: input.isTaxDeductible,
      receipt_url: input.receiptPath,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}
