import { describe, expect, it } from "vitest";
import { aggregateItemsSold, totalItemsSold, type SoldLine } from "@/lib/items-sold";

describe("aggregateItemsSold", () => {
  it("sums quantity and revenue per item name across lines", () => {
    const lines: SoldLine[] = [
      { name: "Fish Bun", qty: 2, lineTotal: 220 },
      { name: "Chicken Kottu", qty: 1, lineTotal: 500 },
      { name: "Fish Bun", qty: 3, lineTotal: 330 },
    ];

    expect(aggregateItemsSold(lines)).toEqual([
      { name: "Fish Bun", qty: 5, revenue: 550 },
      { name: "Chicken Kottu", qty: 1, revenue: 500 },
    ]);
  });

  it("sorts by quantity desc, then name asc for ties", () => {
    const lines: SoldLine[] = [
      { name: "Milk Coffee", qty: 4, lineTotal: 600 },
      { name: "Plain Tea", qty: 4, lineTotal: 400 },
      { name: "Egg Roti", qty: 9, lineTotal: 900 },
    ];

    expect(aggregateItemsSold(lines).map((row) => row.name)).toEqual([
      "Egg Roti",
      "Milk Coffee",
      "Plain Tea",
    ]);
  });

  it("does not use float arithmetic on money", () => {
    // 0.1 + 0.2 !== 0.3 in float; Decimal keeps it exact.
    const lines: SoldLine[] = [
      { name: "Sample", qty: 1, lineTotal: 0.1 },
      { name: "Sample", qty: 1, lineTotal: 0.2 },
    ];

    expect(aggregateItemsSold(lines)[0].revenue).toBe(0.3);
  });

  it("returns an empty array for no lines", () => {
    expect(aggregateItemsSold([])).toEqual([]);
  });
});

describe("totalItemsSold", () => {
  it("sums quantity across every item row", () => {
    expect(
      totalItemsSold([
        { name: "A", qty: 5, revenue: 100 },
        { name: "B", qty: 3, revenue: 60 },
      ]),
    ).toBe(8);
  });

  it("is zero for an empty breakdown", () => {
    expect(totalItemsSold([])).toBe(0);
  });
});
