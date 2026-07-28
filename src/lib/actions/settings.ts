"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profile";

export type SettingsResult = { ok: true } | { ok: false; error: string };

/**
 * Owner-only (settings_write RLS) — ARCHITECTURE.md flags redeem rate as
 * "needs owner sign-off": at earn 1/LKR, redeem 1 LKR/point would be a 100%
 * discount, so this never accepts a value from anywhere but a direct owner
 * edit here.
 */
export async function updateLoyaltyRates(input: {
  earnPointsPerLkr: number;
  redeemLkrPerPoint: number;
}): Promise<SettingsResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "not authenticated" };
  if (input.earnPointsPerLkr < 0 || input.redeemLkrPerPoint < 0) {
    return { ok: false, error: "Rates cannot be negative." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("settings").upsert(
    [
      {
        business_id: profile.business_id,
        key: "loyalty.earn_points_per_lkr",
        value: input.earnPointsPerLkr,
        is_public: true,
      },
      {
        business_id: profile.business_id,
        key: "loyalty.redeem_lkr_per_point",
        value: input.redeemLkrPerPoint,
        is_public: true,
      },
    ],
    { onConflict: "business_id,key" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
