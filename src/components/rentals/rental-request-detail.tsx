"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { rentalStatuses } from "@/lib/rentals/constants";
import {
  createEmailUrl,
  createPhoneUrl,
  createWhatsAppUrl,
} from "@/lib/utils/contact";
import { salesFetch } from "@/components/sales/client-api";
import {
  Field,
  SalesHeading,
  Status,
  buttonClass,
  inputClass,
  linkClass,
} from "@/components/sales/ui";
export function RentalRequestDetail({
  request,
  admins,
}: {
  request: any;
  admins: Array<{ id: string; name: string }>;
}) {
  const [status, setStatus] = useState(request.status);
  const [assignedTo, setAssignedTo] = useState(request.assignedTo);
  const [notes, setNotes] = useState(request.adminNotes);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  async function save() {
    setSaving(true);
    try {
      const updated = await salesFetch<any>(
        `/api/rental-requests/${request.id}`,
        "PUT",
        { status, assignedTo, adminNotes: notes, version: request.version },
      );
      setMessage("Request saved.");
      setAssignedTo(updated.assignedTo);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save request.");
    } finally {
      setSaving(false);
    }
  }
  async function quote() {
    setSaving(true);
    try {
      const result = await salesFetch<{ id: string }>(
        `/api/rental-requests/${request.id}/quotation`,
        "POST",
      );
      router.push(`/admin/sales/quotations/${result.id}`);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Unable to create quotation.",
      );
    } finally {
      setSaving(false);
    }
  }
  const fields = [
    "customerName",
    "companyName",
    "eventType",
    "eventName",
    "eventStartDate",
    "eventEndDate",
    "venueName",
    "venueAddress",
    "city",
    "state",
    "country",
    "indoorOutdoor",
    "productNameSnapshot",
    "quantity",
    "preferredPixelPitch",
    "message",
  ];
  return (
    <>
      <SalesHeading
        title={request.referenceNumber}
        description="Review dates, venue and requirements before preparing a rental quotation."
      >
        <button className={buttonClass} onClick={quote} disabled={saving}>
          Create Rental Quotation
        </button>
      </SalesHeading>
      <div className="mb-5 flex flex-wrap gap-4">
        <a className={linkClass} href={createPhoneUrl(request.customerPhone)}>
          Call customer
        </a>
        <a className={linkClass} href={createEmailUrl(request.customerEmail)}>
          Email customer
        </a>
        <a
          className={linkClass}
          href={createWhatsAppUrl(
            request.whatsappNumber || request.customerPhone,
            `Hello ${request.customerName}, regarding rental request ${request.referenceNumber}.`,
          )}
        >
          WhatsApp customer
        </a>
        <Status value={request.status} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-xl border bg-white p-6">
          <dl className="grid gap-5 sm:grid-cols-2">
            {fields.map((key) => (
              <div key={key}>
                <dt className="text-xs font-bold text-slate-500 uppercase">
                  {key.replace(/[A-Z]/g, (m) => ` ${m}`)}
                </dt>
                <dd className="mt-1 whitespace-pre-wrap">
                  {request[key] || "Not provided"}
                </dd>
              </div>
            ))}
          </dl>
          <h2 className="mt-7 font-bold">Event description</h2>
          <p className="mt-2 whitespace-pre-wrap">
            {request.eventDescription || "Not provided"}
          </p>
        </section>
        <section className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold">Manage request</h2>
          <div className="mt-5 space-y-5">
            <Field label="Status">
              <select
                className={inputClass}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {rentalStatuses.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Assigned admin">
              <select
                className={inputClass}
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">Unassigned</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Private admin notes">
              <textarea
                className={inputClass}
                rows={8}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
            <button className={buttonClass} disabled={saving} onClick={save}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            {message && <p role="status">{message}</p>}
          </div>
        </section>
      </div>
      <Link
        className={`${linkClass} mt-6 inline-block`}
        href="/admin/rentals/requests"
      >
        Back to requests
      </Link>
    </>
  );
}
