import { formatDate } from "@/lib/format";
import type { PriorityCustomerRow } from "@/lib/queries/customers";

function csvField(value: string): string {
  return /["\n,]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Reference list for staff — priority customers' names and phone numbers,
 * so the counter can recognise a regular without hunting through the full
 * customer table. Same quoted-CSV shape as reports.ts/tax.ts's builders.
 */
export function buildPriorityCustomersCsv(customers: PriorityCustomerRow[]): string {
  const header = ["Name", "Phone", "Reason", "Total spend", "Orders", "Last order"];
  const rows = customers.map((customer) => [
    customer.name ?? "Unnamed",
    customer.phone_e164,
    customer.is_priority ? customer.priority_note || "Marked priority" : "Top spender",
    String(customer.total_spend),
    String(customer.order_count),
    customer.last_order_at ? formatDate(customer.last_order_at, "date") : "—",
  ]);

  return [header, ...rows].map((row) => row.map(csvField).join(",")).join("\n");
}
