"use client";

import { useState } from "react";
import { DataTable } from "@/components/patterns/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Booking } from "@/lib/queries/bookings";
import { BookingDrawer } from "./BookingDrawer";

export function BookingsList({ bookings }: { bookings: Booking[] }) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(false);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setIsNewDrawerOpen(true)}>New Booking</Button>
      </div>

      <DataTable
        data={bookings}
        columns={[
          {
            header: "Date / Time",
            accessor: (b) => `${b.date} at ${b.time.slice(0, 5)}`,
          },
          {
            header: "Customer",
            accessor: (b) => b.customer_name,
          },
          {
            header: "Phone",
            accessor: (b) => b.phone,
          },
          {
            header: "Party Size",
            accessor: (b) => String(b.party_size),
          },
          {
            header: "Status",
            accessor: (b) => (
              <Badge 
                variant={b.status === "confirmed" ? "default" : b.status === "cancelled" ? "destructive" : "secondary"}
                className="capitalize"
              >
                {b.status}
              </Badge>
            ),
          },
          {
            header: "Source",
            accessor: (b) => <span className="capitalize">{b.source.replace("_", " ")}</span>,
          }
        ]}
        getRowKey={(b) => b.id}
        onRowClick={(b) => setSelectedBooking(b)}
      />

      <BookingDrawer
        booking={selectedBooking}
        isOpen={!!selectedBooking || isNewDrawerOpen}
        onClose={() => {
          setSelectedBooking(null);
          setIsNewDrawerOpen(false);
        }}
      />
    </>
  );
}
