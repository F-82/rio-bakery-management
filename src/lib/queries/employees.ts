import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type EmployeeProfile = Database["public"]["Tables"]["profiles"]["Row"] & {
  counters: { name: string; kind: string } | null;
};

export async function getEmployees(): Promise<EmployeeProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*, counters(name, kind)")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data as EmployeeProfile[];
}
