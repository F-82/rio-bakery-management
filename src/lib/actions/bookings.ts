"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/queries/profile";
import type { Database } from "@/types/database";

type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];

export async function createBooking(input: Omit<BookingInsert, "business_id" | "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  
  if (!profile) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("bookings")
    .insert({
      ...input,
      business_id: profile.business_id,
    });

  if (error) return { success: false, error: error.message };
  
  revalidatePath("/bookings");
  return { success: true };
}

export async function updateBooking(id: string, input: BookingUpdate) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("bookings")
    .update(input)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  
  revalidatePath("/bookings");
  return { success: true };
}

export async function deleteBooking(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  
  revalidatePath("/bookings");
  return { success: true };
}
