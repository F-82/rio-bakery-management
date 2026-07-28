import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type BookingSource = Database["public"]["Enums"]["booking_source"];

export async function getBookings(): Promise<Booking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getBooking(id: string): Promise<Booking | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}
