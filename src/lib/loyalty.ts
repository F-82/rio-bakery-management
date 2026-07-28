import { Decimal } from "decimal.js";

type RateInput = Decimal | number | string;

/**
 * Points earned on an amount actually paid. Preview-only — create_order
 * recomputes this server-side from settings, never trusts a client value
 * (Invariant 3). Mirrors the RPC's `floor(v_total * v_earn_rate)::integer`.
 */
export function pointsFromSpend(total: RateInput, earnRatePerLkr: RateInput): number {
  const t = total instanceof Decimal ? total : new Decimal(total);
  const rate = earnRatePerLkr instanceof Decimal ? earnRatePerLkr : new Decimal(earnRatePerLkr);
  return t.times(rate).floor().toNumber();
}

/** LKR value of a point count at the current redeem rate. */
export function redemptionValue(points: number, redeemRateLkrPerPoint: RateInput): Decimal {
  const rate = redeemRateLkrPerPoint instanceof Decimal ? redeemRateLkrPerPoint : new Decimal(redeemRateLkrPerPoint);
  return new Decimal(points).times(rate);
}

/**
 * Clamps a requested redemption to what's actually usable: the customer's
 * balance, and whatever discount room is left on the order after any manual
 * discount. Mirrors the RPC's clamp so the till can preview the real number
 * before confirming — the RPC's clamp is still the authoritative one.
 */
export function clampRedeemPoints(
  requestedPoints: number,
  availablePoints: number,
  redeemRateLkrPerPoint: RateInput,
  discountRoom: RateInput,
): number {
  if (requestedPoints <= 0) return 0;
  const rate = redeemRateLkrPerPoint instanceof Decimal ? redeemRateLkrPerPoint : new Decimal(redeemRateLkrPerPoint);
  const room = discountRoom instanceof Decimal ? discountRoom : new Decimal(discountRoom);
  const maxByRoom = rate.isZero() ? 0 : room.dividedBy(rate).floor().toNumber();
  return Math.max(0, Math.min(requestedPoints, availablePoints, maxByRoom));
}
