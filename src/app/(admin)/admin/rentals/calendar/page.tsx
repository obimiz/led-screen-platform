import { requireRentalAdmin } from "@/lib/rentals/access";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUpcomingRentals } from "@/services/rentals";
import { SalesHeading, Status, linkClass } from "@/components/sales/ui";
import Link from "next/link";
export default async function RentalCalendarPage() {
  await requireRentalAdmin();
  const bookings = await getUpcomingRentals();
  return (
    <>
      <SalesHeading
        title="Rental calendar"
        description="Upcoming confirmed and pending rentals ordered by booking start."
      />
      <div className="rounded-xl border bg-white">
        <div className="grid gap-0 md:grid-cols-2">
          {bookings.length ? (
            bookings.map((b: any) => (
              <Link
                href={`/admin/rentals/bookings/${b.id}`}
                key={b.id}
                className="border-b p-5 hover:bg-slate-50"
              >
                <div className="flex justify-between gap-3">
                  <strong>{b.bookingStart.slice(0, 10)}</strong>
                  <Status value={b.bookingStatus} />
                </div>
                <h2 className="mt-2 font-bold">
                  {b.eventSnapshot.eventName || b.eventSnapshot.eventType}
                </h2>
                <p className="text-sm text-slate-600">
                  {b.customerSnapshot.name} · {b.venue}
                </p>
                <p className="mt-2 text-xs">
                  {b.equipment
                    .map((e: any) => `${e.name} × ${e.quantity}`)
                    .join(", ")}
                </p>
              </Link>
            ))
          ) : (
            <p className="p-10">No upcoming rental bookings.</p>
          )}
        </div>
      </div>
      <Link
        href="/admin/rentals/bookings"
        className={`${linkClass} mt-5 inline-block`}
      >
        View all bookings
      </Link>
    </>
  );
}
