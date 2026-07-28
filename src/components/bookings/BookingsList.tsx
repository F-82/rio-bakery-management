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
        rows={bookings}
        columns={[
          {
            key: "datetime",
            header: "Date / Time",
            render: (b) => `${b.date} at ${b.time.slice(0, 5)}`,
          },
          {
            key: "customer",
            header: "Customer",
            render: (b) => b.customer_name,
          },
          {
            key: "phone",
            header: "Phone",
            render: (b) => b.phone,
          },
          {
            key: "partysize",
            header: "Party Size",
            render: (b) => String(b.party_size),
          },
          {
            key: "status",
            header: "Status",
            render: (b) => (
              <Badge 
                variant={b.status === "confirmed" ? "default" : b.status === "cancelled" ? "destructive" : "secondary"}
                className="capitalize"
              >
                {b.status}
              </Badge>
            ),
          },
          {
            key: "source",
            header: "Source",
            render: (b) => <span className="capitalize">{b.source.replace("_", " ")}</span>,
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
