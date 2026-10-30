"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  statusTransitions,
  type QuotationStatus,
} from "@/lib/sales/calculations";
import { createWhatsAppUrl, createEmailUrl } from "@/lib/utils/contact";
import type { Quotation } from "@/types/sales";
import { salesFetch } from "./client-api";
import { buttonClass, linkClass } from "./ui";
export function QuotationActions({ quotation: q }: { quotation: Quotation }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const labels: Partial<Record<QuotationStatus, string>> = {
    sent: "Mark sent",
    viewed: "Mark viewed",
    accepted: "Accept",
    rejected: "Reject",
    cancelled: "Cancel quotation",
    converted: "Convert to sale",
    draft: "Reopen as draft",
    expired: "Mark expired",
  };
  const whatsapp = createWhatsAppUrl(
    q.customer.whatsappNumber || q.customer.phone,
    `Hello ${q.customer.name}, your quotation ${q.quotationNumber} is ready. Please contact us for your quotation document.`,
  );
  return (
    <div className="no-print mb-6 space-y-4">
      <div className="flex flex-wrap gap-3">
        {q.status === "draft" && (
          <Link
            className={buttonClass}
            href={`/admin/sales/quotations/${q.id}/edit`}
          >
            Edit quotation
          </Link>
        )}
        {q.quotationType === "rental" && q.status === "accepted" && (
          <button
            className={buttonClass}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setMessage("");
              try {
                const result = await salesFetch<{ id: string }>(
                  `/api/quotations/${q.id}/rental-booking`,
                  "POST",
                );
                router.push(`/admin/rentals/bookings/${result.id}`);
              } catch (e) {
                setMessage(
                  e instanceof Error
                    ? e.message
                    : "Unable to create rental booking.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Convert to Rental Booking
          </button>
        )}
        {q.quotationType === "installation" && q.status === "accepted" && (
          <button
            className={buttonClass}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setMessage("");
              try {
                const result = await salesFetch<{ id: string }>(
                  `/api/quotations/${q.id}/installation-project`,
                  "POST",
                );
                router.push(`/admin/installations/projects/${result.id}`);
              } catch (e) {
                setMessage(
                  e instanceof Error
                    ? e.message
                    : "Unable to create installation project.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Convert to Installation Project
          </button>
        )}
        <Link
          className={buttonClass}
          href={`/admin/sales/quotations/${q.id}/print`}
        >
          Print / save PDF
        </Link>
        {whatsapp && (
          <a
            className={buttonClass}
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            Share on WhatsApp
          </a>
        )}
        {q.customer.email && (
          <>
            <a className={linkClass} href={createEmailUrl(q.customer.email)}>
              {q.customer.email}
            </a>
            <button
              className={linkClass}
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(q.customer.email);
                  setMessage("Customer email copied.");
                } catch {
                  setMessage("Copy the email address shown above.");
                }
              }}
            >
              Copy email
            </button>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {statusTransitions[q.effectiveStatus].map((status) => (
          <button
            key={status}
            disabled={busy}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
            onClick={async () => {
              setBusy(true);
              setMessage("");
              try {
                await salesFetch(`/api/quotations/${q.id}/status`, "PATCH", {
                  status,
                  version: q.version,
                });
                router.refresh();
              } catch (e) {
                setMessage(
                  e instanceof Error ? e.message : "Status change failed.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {labels[status] || status}
          </button>
        ))}
      </div>
      {q.effectiveStatus === "accepted" && (
        <p className="text-xs text-slate-600">
          Convert to sale records the conversion date and locks this quotation.
          Orders and payments are handled in a future module.
        </p>
      )}
      {q.status !== "draft" && q.status !== "converted" && (
        <p className="text-xs text-slate-600">
          To revise pricing, reopen as draft. Previous acceptance/rejection
          dates are retained.
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
export function PrintButton() {
  return (
    <button className={buttonClass} onClick={() => window.print()}>
      Print / save as PDF
    </button>
  );
}
