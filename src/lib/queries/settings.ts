import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { getCurrentProfile } from "./profile";

export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type Setting = Database["public"]["Tables"]["settings"]["Row"];

export async function getBusinessSettings() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const [businessRes, settingsRes] = await Promise.all([
    supabase
      .from("businesses")
      .select("*")
      .eq("id", profile.business_id)
      .single(),
    supabase
      .from("settings")
      .select("*")
      .eq("business_id", profile.business_id)
  ]);

  if (businessRes.error) throw businessRes.error;
  if (settingsRes.error) throw settingsRes.error;

  // Convert settings array to object for easier consumption
  const settings = settingsRes.data.reduce((acc, curr) => {
    acc[curr.key] = typeof curr.value === 'string' ? curr.value as string : "";
    return acc;
  }, {} as Record<string, string>);

  return {
    business: businessRes.data,
    settings,
  };
}
