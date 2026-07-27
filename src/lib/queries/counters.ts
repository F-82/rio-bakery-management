import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ActiveCounter = Pick<Database["public"]["Tables"]["counters"]["Row"], "id" | "name" | "kind">;

/** Active counters for the POS counter selector. */
export async function getActiveCounters(): Promise<ActiveCounter[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("counters")
    .select("id, name, kind")
    .eq("active", true)
    .order("name");

  if (error) throw error;
  return data;
}
