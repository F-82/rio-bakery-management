import { Decimal } from "decimal.js";

/**
 * "How many of each plate were sold" — pure aggregation over order lines,
 * same split as lib/reports.ts: testable math here, Supabase reads in
 * lib/queries/*. Feeds both the Orders-page panel and the Sales report's
 * By-item breakdown, so they can never disagree.
 */

/** One order line as it comes off order_items (name snapshot, not live menu name). */
export type SoldLine = { name: string; qty: number; lineTotal: number };

export type ItemsSoldRow = { name: string; qty: number; revenue: number };

/**
 * Sum quantity and revenue per item name. Money stays in Decimal until the
 * final toNumber (Invariant: never JS float arithmetic on money). Sorted by
 * quantity desc, then name asc so ties are stable and alphabetical.
 */
export function aggregateItemsSold(lines: SoldLine[]): ItemsSoldRow[] {
  const byName = new Map<string, { qty: number; revenue: Decimal }>();

  for (const line of lines) {
    const existing = byName.get(line.name) ?? { qty: 0, revenue: new Decimal(0) };
    existing.qty += line.qty;
    existing.revenue = existing.revenue.plus(line.lineTotal);
    byName.set(line.name, existing);
  }

  return [...byName.entries()]
    .map(([name, value]) => ({ name, qty: value.qty, revenue: value.revenue.toNumber() }))
    .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));
}

/** Total plates sold across every item — the headline figure for the panel. */
export function totalItemsSold(rows: ItemsSoldRow[]): number {
  return rows.reduce((sum, row) => sum + row.qty, 0);
}
