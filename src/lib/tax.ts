import { Decimal } from "decimal.js";
import { formatDate, formatLKR } from "@/lib/format";
import type { Database } from "@/types/database";

/**
 * Pure tax-report math, same split as lib/finance.ts / lib/reports.ts — one
 * module of testable functions, one module of Supabase reads
 * (lib/queries/tax.ts). Read ARCHITECTURE.md Invariant 7 before touching
 * this file: gross revenue is the actual, unmodified sum of completed order
 * totals. No multiplier, adjustment factor, reduction setting or "reported
 * revenue" field exists here, and none may be added.
 */

export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type TaxCategory = Database["public"]["Enums"]["tax_category"];

export type TaxOrder = { status: OrderStatus; total: number };

/** Gross revenue = actual sum of completed order totals for the period (ARCHITECTURE.md §Tax Report). Nothing else contributes. */
export function summariseGrossRevenue(orders: TaxOrder[]): number {
  return orders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum.plus(order.total), new Decimal(0))
    .toNumber();
}

export type TaxCategoryLine = { taxCategory: TaxCategory; lineTotal: number };

export type TaxCategoryBreakdownRow = { category: TaxCategory; label: string; revenue: number };

export const TAX_CATEGORY_LABELS: Record<TaxCategory, string> = {
  standard: "Standard",
  zero_rated: "Zero-rated",
  exempt: "Exempt",
};

const ALL_TAX_CATEGORIES: TaxCategory[] = ["standard", "zero_rated", "exempt"];

/**
 * One row per tax_category, zero-filled — a category with no completed
 * sales this period is still a row showing zero, not a missing one. Lines
 * are pre-filtered to completed orders by the query (lib/queries/tax.ts),
 * same as gross revenue.
 */
export function buildTaxCategoryBreakdown(lines: TaxCategoryLine[]): TaxCategoryBreakdownRow[] {
  const byCategory = new Map<TaxCategory, Decimal>(ALL_TAX_CATEGORIES.map((category) => [category, new Decimal(0)]));
  for (const line of lines) {
    byCategory.set(line.taxCategory, (byCategory.get(line.taxCategory) ?? new Decimal(0)).plus(line.lineTotal));
  }
  return ALL_TAX_CATEGORIES.map((category) => ({
    category,
    label: TAX_CATEGORY_LABELS[category],
    revenue: (byCategory.get(category) ?? new Decimal(0)).toNumber(),
  }));
}

/**
 * Taxable revenue counts `standard` line revenue only. `zero_rated` and
 * `exempt` are both excluded from the taxable base — this *is* Invariant
 * 7's "real per-item tax categories" mechanism, the only lawful way this
 * report may show a figure lower than gross revenue. Not a rate, not a
 * multiplier: a category a line item was already tagged with at order time.
 */
export function summariseTaxableRevenue(lines: TaxCategoryLine[]): number {
  return lines
    .filter((line) => line.taxCategory === "standard")
    .reduce((sum, line) => sum.plus(line.lineTotal), new Decimal(0))
    .toNumber();
}

export function summariseDeductibleExpenses(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum.plus(amount), new Decimal(0)).toNumber();
}

/** Net taxable income = taxable revenue − itemised deductible expenses. The only two real, per-item/per-expense inputs Invariant 7 allows. */
export function calculateNetTaxableIncome(taxableRevenue: number, deductibleExpenses: number): number {
  return new Decimal(taxableRevenue).minus(deductibleExpenses).toNumber();
}

export type TaxExpenseRow = {
  id: string;
  date: string;
  category: string;
  amount: number;
  note: string | null;
};

export type TaxGranularity = "monthly" | "quarterly" | "annual";

export const TAX_GRANULARITIES: { value: TaxGranularity; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

const DEFAULT_GRANULARITY: TaxGranularity = "monthly";

/**
 * Pure — must not live in a "use client" file. It did (GranularitySelector.tsx),
 * which crashed /tax at runtime: importing a plain function (not a component)
 * from a client module into a Server Component throws "getTaxGranularity is
 * on the client" the moment the page tries to call it directly, the same
 * error class production logs already showed once for getFinanceTab.
 */
export function getTaxGranularity(searchParams: { granularity?: string }): TaxGranularity {
  const granularity = searchParams.granularity;
  return granularity === "quarterly" || granularity === "annual" ? granularity : DEFAULT_GRANULARITY;
}

export type DateRange = { from: string; to: string };

/** Same fixed UTC+05:30 offset technique as colomboToday() (lib/dashboard.ts) — Sri Lanka has no DST. */
function colomboNow(): Date {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function lastDayOfMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

/**
 * The filing period the report opens on, before the owner navigates to an
 * earlier one — "2026-07", "2026-Q3" or "2026" depending on granularity.
 */
export function currentTaxPeriodValue(granularity: TaxGranularity): string {
  const now = colomboNow();
  const year = now.getUTCFullYear();
  const month0 = now.getUTCMonth();

  switch (granularity) {
    case "monthly":
      return `${year}-${pad2(month0 + 1)}`;
    case "quarterly":
      return `${year}-Q${Math.floor(month0 / 3) + 1}`;
    case "annual":
      return `${year}`;
  }
}

const MONTH_VALUE = /^(\d{4})-(\d{2})$/;
const QUARTER_VALUE = /^(\d{4})-Q([1-4])$/;
const YEAR_VALUE = /^(\d{4})$/;

/**
 * Full calendar range for a filing period — the whole month/quarter/year,
 * never clamped to today. Unlike lib/finance.ts's rolling dashboard
 * periods, a tax filing needs the complete period even after it has ended.
 * Falls back to the current period for a malformed or missing value rather
 * than throwing — this only ever runs against our own picker's query param.
 */
export function getTaxPeriodRange(granularity: TaxGranularity, value: string): DateRange {
  if (granularity === "monthly") {
    const match = MONTH_VALUE.exec(value);
    if (!match) return getTaxPeriodRange(granularity, currentTaxPeriodValue(granularity));
    const year = Number(match[1]);
    const month0 = Number(match[2]) - 1;
    return {
      from: ymd(new Date(Date.UTC(year, month0, 1))),
      to: ymd(new Date(Date.UTC(year, month0, lastDayOfMonth(year, month0)))),
    };
  }

  if (granularity === "quarterly") {
    const match = QUARTER_VALUE.exec(value);
    if (!match) return getTaxPeriodRange(granularity, currentTaxPeriodValue(granularity));
    const year = Number(match[1]);
    const startMonth0 = (Number(match[2]) - 1) * 3;
    const endMonth0 = startMonth0 + 2;
    return {
      from: ymd(new Date(Date.UTC(year, startMonth0, 1))),
      to: ymd(new Date(Date.UTC(year, endMonth0, lastDayOfMonth(year, endMonth0)))),
    };
  }

  const match = YEAR_VALUE.exec(value);
  if (!match) return getTaxPeriodRange(granularity, currentTaxPeriodValue(granularity));
  const year = Number(match[1]);
  return { from: ymd(new Date(Date.UTC(year, 0, 1))), to: ymd(new Date(Date.UTC(year, 11, 31))) };
}

function csvField(value: string): string {
  return /["\n,]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function csvRow(fields: string[]): string {
  return fields.map(csvField).join(",");
}

export type TaxCsvInput = {
  range: DateRange;
  grossRevenue: number;
  categoryBreakdown: TaxCategoryBreakdownRow[];
  taxableRevenue: number;
  deductibleExpenses: number;
  netTaxableIncome: number;
  expenses: TaxExpenseRow[];
};

/** One CSV covering the whole report — summary, category breakdown, itemised deductible expenses — quoted per-field like reports.ts's buildDetailCsv. */
export function buildTaxCsv(input: TaxCsvInput): string {
  const lines: string[] = [];

  lines.push(csvRow(["Tax report", `${input.range.from} to ${input.range.to}`]));
  lines.push("");
  lines.push(csvRow(["Summary"]));
  lines.push(csvRow(["Gross revenue", formatLKR(input.grossRevenue)]));
  lines.push(csvRow(["Taxable revenue", formatLKR(input.taxableRevenue)]));
  lines.push(csvRow(["Deductible expenses", formatLKR(input.deductibleExpenses)]));
  lines.push(csvRow(["Net taxable income", formatLKR(input.netTaxableIncome)]));
  lines.push("");
  lines.push(csvRow(["Revenue by tax category"]));
  lines.push(csvRow(["Category", "Revenue"]));
  for (const row of input.categoryBreakdown) {
    lines.push(csvRow([row.label, formatLKR(row.revenue)]));
  }
  lines.push("");
  lines.push(csvRow(["Deductible expenses"]));
  lines.push(csvRow(["Date", "Category", "Amount", "Note"]));
  for (const expense of input.expenses) {
    lines.push(csvRow([formatDate(expense.date, "date"), expense.category, formatLKR(expense.amount), expense.note ?? "—"]));
  }

  return lines.join("\n");
}
