import { notFound } from "next/navigation";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireRentalAdmin } from "@/lib/rentals/access";
import { getRentalBookingById } from "@/services/rentals";
import { getDocumentBusinessSettings } from "@/services/business-settings";
import { PrintButton } from "@/components/sales/quotation-actions";
export default async function RentalPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRentalAdmin();
  const booking = await getRentalBookingById((await params).id);
  if (!booking) notFound();
  const business = await getDocumentBusinessSettings();
  return (
    <div className="quotation-print-view">
      <div className="no-print mx-auto mb-6 max-w-5xl">
        <PrintButton />
      </div>
      <article className="quotation-document mx-auto max-w-5xl rounded-xl border bg-white p-6">
        <header className="border-b-2 border-slate-900 pb-5">
          <h1 className="text-3xl font-black">{business.businessName}</h1>
          <p>{business.address}</p>
          <h2 className="mt-6 text-2xl uppercase">
            Rental booking {booking.bookingNumber}
          </h2>
        </header>
        <div className="my-6 grid gap-4 sm:grid-cols-2">
          <p>
            <strong>Customer</strong>
            <br />
            {booking.customerSnapshot.name}
            <br />
            {booking.customerSnapshot.companyName}
            <br />
            {booking.customerSnapshot.email}
            <br />
            {booking.customerSnapshot.phone}
          </p>
          <p>
            <strong>Event</strong>
            <br />
            {booking.eventSnapshot.eventName || booking.eventSnapshot.eventType}
            <br />
            {booking.bookingStart.toString().slice(0, 16)} to{" "}
            {booking.bookingEnd.toString().slice(0, 16)}
            <br />
            {booking.venue}
          </p>
        </div>
        <h3 className="font-bold">Equipment</h3>
        <table className="mt-2 w-full text-left text-sm">
          <tbody>
            {booking.equipment.map((e: any) => (
              <tr className="border-b" key={e.productId}>
                <td className="py-3">
                  {e.name} ({e.sku})
                </td>
                <td>{e.quantity}</td>
                <td className="text-right">
                  {booking.currency} {(e.lineTotal / 100).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 className="mt-6 font-bold">Services</h3>
        {booking.services.map((s: any) => (
          <p key={s.name}>
            {s.name} — {booking.currency} {(s.lineTotal / 100).toFixed(2)}
          </p>
        ))}
        <p className="mt-6 text-right text-xl font-bold">
          Total: {booking.currency} {(booking.total / 100).toFixed(2)}
        </p>
        <p className="mt-4">
          Deposit:{" "}
          {booking.depositRequired
            ? `${booking.currency} ${(booking.depositAmount / 100).toFixed(2)} (${booking.depositStatus})`
            : "Not required"}
          <br />
          Paid: {booking.currency} {(booking.amountPaid / 100).toFixed(2)} ·
          Balance: {booking.currency} {(booking.balanceDue / 100).toFixed(2)}
        </p>
        <p className="mt-6 whitespace-pre-wrap">{booking.notes}</p>
      </article>
    </div>
  );
}
