"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  bookingStatuses,
  operationalStatuses,
  depositStatuses,
} from "@/lib/rentals/constants";
import { createWhatsAppUrl } from "@/lib/utils/contact";
import { salesFetch } from "@/components/sales/client-api";
import {
  SalesHeading,
  Status,
  buttonClass,
  inputClass,
  linkClass,
} from "@/components/sales/ui";
export function BookingDetail({ booking }: { booking: any }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function update(body: any) {
    setBusy(true);
    try {
      await salesFetch(`/api/rental-bookings/${booking.id}/status`, "PATCH", {
        ...body,
        version: booking.version,
      });
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to update booking.");
    } finally {
      setBusy(false);
    }
  }
  const whatsapp = createWhatsAppUrl(
    booking.customerSnapshot.whatsappNumber || booking.customerSnapshot.phone,
    `Hello ${booking.customerSnapshot.name}, regarding rental booking ${booking.bookingNumber}.`,
  );
  return (
    <>
      <SalesHeading title={booking.bookingNumber}>
        <Link
          className={buttonClass}
          href={`/admin/rentals/bookings/${booking.id}/print`}
        >
          Print booking
        </Link>
      </SalesHeading>
      <div className="mb-5 flex flex-wrap gap-4">
        <Status value={booking.bookingStatus} />
        <Status value={booking.operationalStatus} />
        {whatsapp && (
          <a
            className={linkClass}
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp customer
          </a>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold">Booking details</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div>
              <dt className="font-semibold">Customer</dt>
              <dd>
                {booking.customerSnapshot.name} ·{" "}
                {booking.customerSnapshot.companyName}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Event</dt>
              <dd>
                {booking.eventSnapshot.eventType} ·{" "}
                {booking.eventSnapshot.eventName}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Dates</dt>
              <dd>
                {booking.bookingStart.slice(0, 16)} to{" "}
                {booking.bookingEnd.slice(0, 16)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Venue</dt>
              <dd className="whitespace-pre-wrap">{booking.venue}</dd>
            </div>
          </dl>
          <h3 className="mt-6 font-bold">Equipment</h3>
          {booking.equipment.map((i: any) => (
            <p key={i.productId}>
              {i.name} × {i.quantity} · {(i.lineTotal / 100).toFixed(2)}{" "}
              {booking.currency}
            </p>
          ))}
          <h3 className="mt-6 font-bold">Services</h3>
          {booking.services.length ? (
            booking.services.map((i: any) => (
              <p key={i.name}>
                {i.name} · {(i.lineTotal / 100).toFixed(2)} {booking.currency}
              </p>
            ))
          ) : (
            <p>None</p>
          )}
        </section>
        <section className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold">Financial summary</h2>
          <p className="mt-4">
            Total:{" "}
            <strong>
              {booking.currency} {(booking.total / 100).toFixed(2)}
            </strong>
          </p>
          <p>
            Paid: {booking.currency} {(booking.amountPaid / 100).toFixed(2)}
          </p>
          <p>
            Balance: {booking.currency} {(booking.balanceDue / 100).toFixed(2)}
          </p>
          <p>
            Deposit:{" "}
            {booking.depositRequired
              ? `${booking.currency} ${(booking.depositAmount / 100).toFixed(2)}`
              : "Not required"}
          </p>
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-semibold">
              Booking status
              <select
                className={`${inputClass} mt-2`}
                disabled={busy}
                value={booking.bookingStatus}
                onChange={(e) => update({ bookingStatus: e.target.value })}
              >
                {bookingStatuses.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Operational status
              <select
                className={`${inputClass} mt-2`}
                value={booking.operationalStatus}
                onChange={(e) => update({ operationalStatus: e.target.value })}
              >
                {operationalStatuses.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Deposit status
              <select
                className={`${inputClass} mt-2`}
                value={booking.depositStatus}
                onChange={(e) => update({ depositStatus: e.target.value })}
              >
                {depositStatuses.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <p className="text-xs text-slate-500">
              Updates are authenticated and availability is rechecked before
              confirmation.
            </p>
            {message && <p role="alert">{message}</p>}
          </div>
        </section>
      </div>
      <Link
        className={`${linkClass} mt-6 inline-block`}
        href="/admin/rentals/bookings"
      >
        Back to bookings
      </Link>
    </>
  );
}
