import { getBookings } from "@/lib/queries/bookings";
import { PageHeader } from "@/components/patterns/PageHeader";
import { BookingsList } from "@/components/bookings/BookingsList";

export default async function BookingsPage() {
  const bookings = await getBookings();

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Bookings"
        description="Manage reservations and party bookings."
      />

      <div className="p-6">
        <BookingsList bookings={bookings} />
      </div>
    </div>
  );
}
