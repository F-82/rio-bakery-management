import { describe, expect, it } from "vitest";
import { renderKitchenTicket } from "../../agent/src/renderer";

const basePayload = {
  order_number: "042",
  counter_id: null,
  created_at: "2026-07-31T08:30:00.000Z",
  items: [{ name: "Chicken Kottu", qty: 1 }],
};

describe("kitchen ticket renderer", () => {
  it("prints takeaway prominently", () => {
    expect(renderKitchenTicket({ ...basePayload, source: "takeaway" })).toContain(
      "*** TAKEAWAY ***",
    );
  });

  it("prints dine-in prominently", () => {
    expect(renderKitchenTicket({ ...basePayload, source: "in_person" })).toContain(
      "*** DINE-IN ***",
    );
  });
});
