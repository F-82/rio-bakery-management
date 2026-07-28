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

import { revalidatePath } from "next/cache";

export async function updateBusinessProfile(businessId: string, name: string): Promise<SettingsResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update({ name })
    .eq("id", businessId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateBusinessLogo(businessId: string, formData: FormData): Promise<SettingsResult> {
  const supabase = await createClient();
  const file = formData.get("logo") as File;
  if (!file) return { ok: false, error: "No file provided" };

  const ext = file.name.split(".").pop();
  const path = `${businessId}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("brand-assets")
    .upload(path, file, { upsert: true });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from("brand-assets")
    .getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("businesses")
    .update({ logo_url: publicUrl })
    .eq("id", businessId);

  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateOtherSettings(businessId: string, newSettings: Record<string, string>): Promise<SettingsResult> {
  const supabase = await createClient();

  const entries = Object.entries(newSettings);
  for (const [key, value] of entries) {
    const { error } = await supabase
      .from("settings")
      .upsert({ business_id: businessId, key, value, is_public: false }, { onConflict: "business_id,key" });
    
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function updateLanguage(profileId: string, languagePref: string): Promise<SettingsResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ language_pref: languagePref })
    .eq("id", profileId);

  if (error) return { ok: false, error: error.message };
  
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}
