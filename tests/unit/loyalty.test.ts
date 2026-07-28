import { describe, expect, it } from "vitest";
import { Decimal } from "decimal.js";
import { clampRedeemPoints, pointsFromSpend, redemptionValue } from "@/lib/loyalty";

describe("pointsFromSpend", () => {
  it("earns at the default 1 point per LKR, floored", () => {
    expect(pointsFromSpend(1250.75, 1)).toBe(1250);
  });

  it("earns zero on a zero total", () => {
    expect(pointsFromSpend(0, 1)).toBe(0);
  });

  it("accepts Decimal inputs without float drift", () => {
    expect(pointsFromSpend(new Decimal("999.999"), new Decimal("1"))).toBe(999);
  });

  it("scales with a non-default earn rate", () => {
    expect(pointsFromSpend(100, 0.5)).toBe(50);
  });
});

describe("redemptionValue", () => {
  it("values points at the default 0.01 LKR/point rate", () => {
    expect(redemptionValue(500, 0.01).toString()).toBe("5");
  });

  it("values zero points as zero", () => {
    expect(redemptionValue(0, 0.01).toString()).toBe("0");
  });
});

describe("clampRedeemPoints", () => {
  it("passes through a request within balance and discount room", () => {
    expect(clampRedeemPoints(100, 500, 0.01, 50)).toBe(100);
  });

  it("clamps to the customer's balance", () => {
    expect(clampRedeemPoints(1000, 300, 0.01, 50)).toBe(300);
  });

  it("clamps to remaining discount room, rounding down to a whole point", () => {
    // room = 3.00 LKR at 0.01/point = 300 points max, even if the customer has more
    expect(clampRedeemPoints(1000, 5000, 0.01, 3)).toBe(300);
  });

  it("rounds the room clamp down, never up", () => {
    // 3.05 / 0.01 = 305 exactly; use an uneven rate to prove flooring
    expect(clampRedeemPoints(1000, 5000, 0.03, 1)).toBe(33);
  });

  it("returns zero when there's no discount room left", () => {
    expect(clampRedeemPoints(100, 500, 0.01, 0)).toBe(0);
  });

  it("returns zero for a non-positive request", () => {
    expect(clampRedeemPoints(0, 500, 0.01, 50)).toBe(0);
    expect(clampRedeemPoints(-10, 500, 0.01, 50)).toBe(0);
  });

  it("earn then redeem round-trips exactly at the default rates", () => {
    // Spend 1000 LKR -> 1000 points earned. Redeeming all 1000 points back
    // at 0.01 LKR/point is worth exactly 10 LKR, and fits easily in a
    // 1000 LKR order's discount room.
    const earned = pointsFromSpend(1000, 1);
    const value = redemptionValue(earned, 0.01);
    expect(earned).toBe(1000);
    expect(value.toString()).toBe("10");
    expect(clampRedeemPoints(earned, earned, 0.01, value)).toBe(1000);
  });
});
