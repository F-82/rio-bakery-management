import { createClient } from "@/lib/supabase/server";
import type { FinanceOrder } from "@/lib/finance";

const RECEIPTS_BUCKET = "receipts";
const RECEIPT_URL_TTL_SECONDS = 3600;

/** Orders in [from, to] (Colombo day, inclusive) — feeds the overview totals and the revenue-by-day chart. */
export async function getOrdersForPeriod(from: string, to: string): Promise<FinanceOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("status, total, order_day")
    .gte("order_day", from)
    .lte("order_day", to);

  if (error) throw error;
  return data.map((row) => ({ status: row.status, total: row.total, orderDay: row.order_day }));
}

/** Expense amounts in [from, to] — the overview's expense side of net profit. */
export async function getExpenseAmountsForPeriod(from: string, to: string): Promise<number[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("expenses").select("amount").gte("date", from).lte("date", to);

  if (error) throw error;
  return data.map((row) => row.amount);
}

export type ExpenseRow = {
  id: string;
  date: string;
  category: string;
  amount: number;
  note: string | null;
  isTaxDeductible: boolean;
  /** Signed URL, ready to open — receipts sit in a private bucket, so this is never a bare path (see queries/finance.ts). */
  receiptUrl: string | null;
};

/**
 * The full ledger (STEPS.md §14 — "Expenses tab: full ledger"), not scoped
 * to the overview's period selector. Receipt paths are resolved to signed
 * URLs in one batched call rather than per-row, since createSignedUrls
 * accepts the whole list at once.
 */
export async function getExpenses(): Promise<ExpenseRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("id, date, category, amount, note, is_tax_deductible, receipt_url")
    .order("date", { ascending: false });

  if (error) throw error;

  const paths = data.map((row) => row.receipt_url).filter((path): path is string => Boolean(path));
  const signedUrlByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed, error: signError } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .createSignedUrls(paths, RECEIPT_URL_TTL_SECONDS);
    if (signError) throw signError;
    signed.forEach((entry, index) => {
      if (entry.signedUrl) signedUrlByPath.set(paths[index], entry.signedUrl);
    });
  }

  return data.map((row) => ({
    id: row.id,
    date: row.date,
    category: row.category,
    amount: row.amount,
    note: row.note,
    isTaxDeductible: row.is_tax_deductible,
    receiptUrl: row.receipt_url ? (signedUrlByPath.get(row.receipt_url) ?? null) : null,
  }));
}

/**
 * Distinct categories used so far — expense categories aren't a fixed enum
 * (no client-specified taxonomy exists, ARCHITECTURE.md §Money), same
 * precedent as getOrderSources (lib/queries/orders.ts): reflects real data
 * as a datalist of suggestions, never an invented list.
 */
export async function getExpenseCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("expenses").select("category").limit(1000);

  if (error) throw error;
  return [...new Set(data.map((row) => row.category))].sort();
}
