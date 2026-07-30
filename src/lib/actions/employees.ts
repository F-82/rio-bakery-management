"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/queries/profile";

type UserRole = Database["public"]["Enums"]["user_role"];

export async function updateEmployeeRole(profileId: string, role: UserRole, counterId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role, counter_id: counterId })
    .eq("id", profileId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/employees");
  return { success: true };
}

export async function updateEmployeeStatus(profileId: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ active })
    .eq("id", profileId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/employees");
  return { success: true };
}

export async function inviteEmployee(email: string, name: string, role: UserRole, counterId: string | null) {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile) return { success: false, error: "Not authenticated" };
  if (currentProfile.role !== "owner" && currentProfile.role !== "manager") {
    return { success: false, error: "Not authorized to invite employees" };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: {
      name,
      role,
      counter_id: counterId,
      business_id: currentProfile.business_id,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/employees");
  return { success: true };
}
