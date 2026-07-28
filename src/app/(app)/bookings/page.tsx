import { getBookings } from "@/lib/queries/bookings";
import { PageHeader } from "@/components/patterns/PageHeader";
import { BookingsList } from "@/components/bookings/BookingsList";
import { getTranslation } from "@/lib/i18n-server";

export default async function BookingsPage() {
    const { t } = await getTranslation();
  const bookings = await getBookings();

  return (
    <div className="flex flex-col">
      <PageHeader
        title={t("Bookings")}
      />

      <div className="p-6">
        <BookingsList bookings={bookings} />
      </div>
    </div>
  );
}
