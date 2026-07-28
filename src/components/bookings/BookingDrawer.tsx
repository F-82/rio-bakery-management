"use client";

import { useState, useTransition, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { createBooking, updateBooking, deleteBooking } from "@/lib/actions/bookings";
import type { Booking, BookingStatus, BookingSource } from "@/lib/queries/bookings";

type BookingDrawerProps = {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
};

export function BookingDrawer({ booking, isOpen, onClose }: BookingDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<BookingStatus>("pending");
  const [source, setSource] = useState<BookingSource>("in_person");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (booking) {
      setDate(booking.date);
      setTime(booking.time.slice(0, 5));
      setPartySize(String(booking.party_size));
      setCustomerName(booking.customer_name);
      setPhone(booking.phone);
      setStatus(booking.status);
      setSource(booking.source);
      setNotes(booking.notes || "");
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]);
      setTime("12:00");
      setPartySize("2");
      setCustomerName("");
      setPhone("");
      setStatus("pending");
      setSource("in_person");
      setNotes("");
    }
  }, [booking, isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setError(null);
      const input = {
        date,
        time: `${time}:00`,
        party_size: parseInt(partySize, 10),
        customer_name: customerName,
        phone,
        status,
        source,
        notes: notes || null,
      };

      const res = booking
        ? await updateBooking(booking.id, input)
        : await createBooking(input);

      if (res.success) {
        onClose();
      } else {
        setError(res.error || "An error occurred");
      }
    });
  };

  const handleDelete = () => {
    if (!booking) return;
    if (!confirm("Are you sure you want to delete this booking?")) return;
    
    startTransition(async () => {
      const res = await deleteBooking(booking.id);
      if (res.success) onClose();
      else setError(res.error || "Failed to delete");
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{booking ? "Edit Booking" : "New Booking"}</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSave} className="mt-6 flex flex-col gap-5">
          <div className="flex gap-4">
            <label className="flex flex-1 flex-col gap-2">
              <span className="text-label text-ink-2">Date</span>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-tile border border-line bg-surface p-3 text-body"
              />
            </label>
            <label className="flex flex-1 flex-col gap-2">
              <span className="text-label text-ink-2">Time</span>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-tile border border-line bg-surface p-3 text-body"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-label text-ink-2">Party Size</span>
            <input
              type="number"
              min="1"
              required
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
              className="rounded-tile border border-line bg-surface p-3 text-body"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-label text-ink-2">Customer Name</span>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="rounded-tile border border-line bg-surface p-3 text-body"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-label text-ink-2">Phone</span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-tile border border-line bg-surface p-3 text-body"
            />
          </label>

          <div className="flex gap-4">
            <label className="flex flex-1 flex-col gap-2">
              <span className="text-label text-ink-2">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="rounded-tile border border-line bg-surface p-3 text-body capitalize"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            
            <label className="flex flex-1 flex-col gap-2">
              <span className="text-label text-ink-2">Source</span>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="rounded-tile border border-line bg-surface p-3 text-body capitalize"
              >
                <option value="in_person">In Person</option>
                <option value="phone">Phone</option>
                <option value="online">Online</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-label text-ink-2">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-tile border border-line bg-surface p-3 text-body"
            />
          </label>

          {error && <p className="text-alert-strong text-body-sm">{error}</p>}

          <div className="mt-4 flex gap-3">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Saving..." : "Save Booking"}
            </Button>
            {booking && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
                Delete
              </Button>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
