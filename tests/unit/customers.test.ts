import { describe, expect, it } from "vitest";
import { buildPriorityCustomersCsv } from "@/lib/customers";
import type { PriorityCustomerRow } from "@/lib/queries/customers";

function customer(overrides: Partial<PriorityCustomerRow> = {}): PriorityCustomerRow {
  return {
    id: "1",
    name: "Nimal Perera",
    phone_e164: "+94771234567",
    loyalty_points: 120,
    total_spend: 45000,
    order_count: 30,
    is_priority: true,
    priority_note: "Regular, orders the birthday cake",
    last_order_at: "2026-07-28T10:00:00Z",
    is_top_spender: false,
    recent_spend: 5000,
    ...overrides,
  };
}

describe("buildPriorityCustomersCsv", () => {
  it("uses the manual note as the reason for a manually flagged priority customer", () => {
    const csv = buildPriorityCustomersCsv([customer()]);
    const rows = csv.split("\n");
    expect(rows[0]).toBe("Name,Phone,Reason,Total spend,Orders,Last order");
    expect(rows[1]).toContain("Nimal Perera");
    expect(rows[1]).toContain("+94771234567");
    expect(rows[1]).toContain("Regular, orders the birthday cake");
  });

  it("falls back to a generic reason when a manual flag has no note", () => {
    const csv = buildPriorityCustomersCsv([customer({ priority_note: null })]);
    expect(csv.split("\n")[1]).toContain("Marked priority");
  });

  it("labels a derived top spender distinctly from a manual flag", () => {
    const csv = buildPriorityCustomersCsv([
      customer({ is_priority: false, priority_note: null, is_top_spender: true }),
    ]);
    expect(csv.split("\n")[1]).toContain("Top spender");
  });

  it("quotes a comma inside a name so it never shifts a column", () => {
    const csv = buildPriorityCustomersCsv([customer({ name: "Perera, Nimal" })]);
    expect(csv.split("\n")[1]).toContain('"Perera, Nimal"');
  });

  it("falls back to Unnamed when the customer has no name on record", () => {
    const csv = buildPriorityCustomersCsv([customer({ name: null })]);
    expect(csv.split("\n")[1]).toContain("Unnamed");
  });
});
