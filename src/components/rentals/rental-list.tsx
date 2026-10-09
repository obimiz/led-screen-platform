"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  rentalStatuses,
  rentalEventTypes,
  bookingStatuses,
} from "@/lib/rentals/constants";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { salesFetch } from "@/components/sales/client-api";
import {
  SalesHeading,
  Status,
  Field,
  inputClass,
  buttonClass,
  linkClass,
} from "@/components/sales/ui";
export function RentalList({ kind }: { kind: "requests" | "bookings" }) {
  const [query, setQuery] = useState("page=1");
  const requests = kind === "requests";
  const { data, error, isPending } = useQuery({
    queryKey: ["rentals", kind, query],
    queryFn: () =>
      salesFetch<any>(
        `/api/${requests ? "rental-requests" : "rental-bookings"}?${query}`,
      ),
  });
  const options = requests ? rentalStatuses : bookingStatuses;
  return (
    <>
      <SalesHeading
        title={requests ? "Rental requests" : "Rental bookings"}
        description={
          requests
            ? "Review event requirements and prepare rental quotations."
            : "Track confirmed equipment, payments and operations."
        }
      >
        {!requests && (
          <Link href="/admin/rentals/calendar" className={buttonClass}>
            Upcoming calendar
          </Link>
        )}
      </SalesHeading>
      <form
        className="mb-6 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2 xl:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          const p = new URLSearchParams(new FormData(e.currentTarget) as any);
          p.set("page", "1");
          setQuery(p.toString());
        }}
      >
        <Field label="Search">
          <input
            name="search"
            className={inputClass}
            placeholder="Reference, customer, venue"
          />
        </Field>
        <Field label="Status">
          <select name="status" className={inputClass}>
            <option value="">All</option>
            {options.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        {requests && (
          <Field label="Event type">
            <select name="eventType" className={inputClass}>
              <option value="">All</option>
              {rentalEventTypes.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="From">
          <input name="from" type="date" className={inputClass} />
        </Field>
        <Field label="To">
          <input name="to" type="date" className={inputClass} />
        </Field>
        <button className={buttonClass}>Apply filters</button>
      </form>
      {isPending && <p>Loading…</p>}
      {error && (
        <p role="alert" className="text-red-700">
          {error.message}
        </p>
      )}
      {data &&
        (data.records.length ? (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {(requests
                    ? [
                        "Reference",
                        "Customer",
                        "Event",
                        "Dates",
                        "Location",
                        "Size",
                        "Status",
                        "Assigned",
                        "Actions",
                      ]
                    : [
                        "Booking",
                        "Customer",
                        "Event",
                        "Dates",
                        "Venue",
                        "Total",
                        "Status",
                        "Operations",
                        "Actions",
                      ]
                  ).map((h) => (
                    <th className="p-4 whitespace-nowrap" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.records.map((r: any) =>
                  requests ? (
                    <tr className="border-t" key={r.id}>
                      <td className="p-4 font-semibold">{r.referenceNumber}</td>
                      <td className="p-4">
                        {r.customerName}
                        <small className="block text-slate-500">
                          {r.companyName}
                        </small>
                      </td>
                      <td className="p-4">
                        {r.eventType === "other"
                          ? r.eventTypeOther
                          : r.eventType}
                        <small className="block">{r.eventName}</small>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {r.eventStartDate}
                        <br />
                        to {r.eventEndDate}
                      </td>
                      <td className="p-4">
                        {[r.city, r.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="p-4">
                        {r.requiredWidth || "?"} × {r.requiredHeight || "?"}{" "}
                        {r.sizeUnit} · {r.quantity}
                      </td>
                      <td className="p-4">
                        <Status value={r.status} />
                      </td>
                      <td className="p-4">{r.assignedName}</td>
                      <td className="p-4">
                        <Link
                          className={linkClass}
                          href={`/admin/rentals/requests/${r.id}`}
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    <tr className="border-t" key={r.id}>
                      <td className="p-4 font-semibold">{r.bookingNumber}</td>
                      <td className="p-4">
                        {r.customerSnapshot.name}
                        <small className="block text-slate-500">
                          {r.customerSnapshot.companyName}
                        </small>
                      </td>
                      <td className="p-4">
                        {r.eventSnapshot.eventType}
                        <small className="block">
                          {r.eventSnapshot.eventName}
                        </small>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {r.bookingStart.slice(0, 10)}
                        <br />
                        to {r.bookingEnd.slice(0, 10)}
                      </td>
                      <td className="p-4">{r.venue}</td>
                      <td className="p-4">
                        {r.currency} {((r.total || 0) / 100).toFixed(2)}
                        <small className="block">
                          Balance: {((r.balanceDue || 0) / 100).toFixed(2)}
                        </small>
                      </td>
                      <td className="p-4">
                        <Status value={r.bookingStatus} />
                      </td>
                      <td className="p-4">
                        <Status value={r.operationalStatus} />
                      </td>
                      <td className="p-4">
                        <Link
                          className={linkClass}
                          href={`/admin/rentals/bookings/${r.id}`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center">
            No {requests ? "rental requests" : "upcoming rental bookings"} yet.
          </div>
        ))}
      {data && (
        <div className="mt-4 flex justify-between">
          <span>
            {data.total} results · Page {data.page} of {data.pages}
          </span>
          <button
            className={buttonClass}
            disabled={data.page >= data.pages}
            onClick={() => {
              const p = new URLSearchParams(query);
              p.set("page", String(data.page + 1));
              setQuery(p.toString());
            }}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
