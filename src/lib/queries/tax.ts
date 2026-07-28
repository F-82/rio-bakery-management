import { createClient } from "@/lib/supabase/server";
import type { TaxCategoryLine, TaxExpenseRow, TaxOrder } from "@/lib/tax";

/** Every order in [from, to] (Colombo day, inclusive) — gross revenue counts completed ones only (lib/tax.ts). */
export async function getTaxOrders(from: string, to: string): Promise<TaxOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select("status, total").gte("order_day", from).lte("order_day", to);

  if (error) throw error;
  return data.map((row) => ({ status: row.status, total: row.total }));
}

/**
 * Line items for completed orders only, in [from, to] — feeds the
 * tax_category breakdown and taxable revenue. Filtered via the `orders`
 * join rather than fetching every line and filtering client-side, since an
 * open or voided order's lines must never enter this report at all.
 */
export async function getTaxCategoryLines(from: string, to: string): Promise<TaxCategoryLine[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("tax_category, line_total, orders!inner(status, order_day)")
    .eq("orders.status", "completed")
    .gte("orders.order_day", from)
    .lte("orders.order_day", to);

  if (error) throw error;
  return data.map((row) => ({ taxCategory: row.tax_category, lineTotal: row.line_total }));
}

/** Itemised deductible expenses in [from, to] — the report's own list, not the full ledger (STEPS.md §16: "Itemised deductible expenses where is_tax_deductible"). */
export async function getDeductibleExpenses(from: string, to: string): Promise<TaxExpenseRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("id, date, category, amount, note")
    .eq("is_tax_deductible", true)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
}
