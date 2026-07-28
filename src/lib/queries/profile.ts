import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * The signed-in user's own profile row. RLS restricts this to self, so no
 * business_id/user filter is needed beyond auth.uid() already enforced by
 * the policy.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return null;
  return data;
}

type CounterKind = Database["public"]["Enums"]["counter_kind"];

export type ProfileContext = {
  profile: Profile;
  businessName: string;
  logoUrl: string | null;
  counter: { name: string; kind: CounterKind } | null;
};

/**
 * Profile plus the names the header displays — the business (for context)
 * and the profile's default counter, if it has one. Owner/manager profiles
 * are typically not pinned to a counter, hence the null.
 */
export async function getCurrentProfileContext(): Promise<ProfileContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*, businesses(name, logo_url), counters(name, kind)")
    .eq("id", user.id)
    .single();

  if (error) return null;

  const { businesses, counters, ...profile } = data;
  return {
    profile,
    businessName: businesses?.name ?? "",
    logoUrl: businesses?.logo_url ?? null,
    counter: counters ? { name: counters.name, kind: counters.kind } : null,
  };
}
