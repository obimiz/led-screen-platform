import { notFound } from "next/navigation";
import { BookingDetail } from "@/components/rentals/booking-detail";
import { requireRentalAdmin } from "@/lib/rentals/access";
import { getRentalBookingById } from "@/services/rentals";
export default async function RentalBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRentalAdmin();
  const booking = await getRentalBookingById((await params).id);
  if (!booking) notFound();
  return <BookingDetail booking={booking} />;
}
