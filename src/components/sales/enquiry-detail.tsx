"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { updateQuoteRequestSchema } from "@/lib/validations/sales";
import { enquiryStatuses, enquirySources } from "@/lib/sales/constants";
import {
  createPhoneUrl,
  createEmailUrl,
  createWhatsAppUrl,
} from "@/lib/utils/contact";
import { formatMoney } from "@/lib/sales/calculations";
import type { AdminOption, Enquiry } from "@/types/sales";
import { salesFetch } from "./client-api";
import {
  Field,
  Status,
  SalesHeading,
  buttonClass,
  inputClass,
  linkClass,
} from "./ui";
export function EnquiryDetail({
  enquiry,
  admins,
}: {
  enquiry: Enquiry;
  admins: AdminOption[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<
    z.input<typeof updateQuoteRequestSchema>,
    unknown,
    z.output<typeof updateQuoteRequestSchema>
  >({
    resolver: zodResolver(updateQuoteRequestSchema),
    defaultValues: {
      status: enquiry.status,
      source: enquiry.source,
      assignedTo: enquiry.assignedTo,
      adminNotes: enquiry.adminNotes,
      version: enquiry.version,
    },
  });
  const rows: [string, string | number | undefined][] = [
    ["Customer", enquiry.customerName],
    ["Company", enquiry.companyName],
    ["Customer type", enquiry.customerType],
    ["Email", enquiry.customerEmail],
    ["Phone", enquiry.customerPhone],
    ["WhatsApp", enquiry.whatsappNumber],
    ["Preferred contact", enquiry.preferredContactMethod],
    ["Product", enquiry.productNameSnapshot || "General enquiry"],
    ["Project type", enquiry.projectType],
    ["Intended use", enquiry.intendedUse],
    ["Indoor / outdoor", enquiry.indoorOutdoor],
    [
      "Width",
      enquiry.requiredWidth == null
        ? ""
        : `${enquiry.requiredWidth} ${enquiry.sizeUnit}`,
    ],
    [
      "Height",
      enquiry.requiredHeight == null
        ? ""
        : `${enquiry.requiredHeight} ${enquiry.sizeUnit}`,
    ],
    ["Quantity", enquiry.quantity],
    ["Preferred pixel pitch", enquiry.preferredPixelPitch],
    ["Location", enquiry.installationLocation],
    [
      "City / state / country",
      [enquiry.city, enquiry.state, enquiry.country].filter(Boolean).join(", "),
    ],
    ["Required date", enquiry.eventDate],
    [
      "Budget",
      enquiry.budget == null
        ? ""
        : formatMoney(enquiry.budget, enquiry.budgetCurrency),
    ],
    ["Source", enquiry.source],
    ["Assigned", enquiry.assignedName],
    ["Created", new Date(enquiry.createdAt).toLocaleString()],
    ["Updated", new Date(enquiry.updatedAt).toLocaleString()],
  ];
  return (
    <>
      <SalesHeading
        title={enquiry.referenceNumber}
        description="Review the customer's requirements before preparing pricing."
      >
        <Link
          className={buttonClass}
          href={`/admin/sales/quotations/new?enquiry=${enquiry.id}`}
        >
          Create quotation
        </Link>
      </SalesHeading>
      <div className="mb-5 flex flex-wrap gap-4">
        <Status value={enquiry.status} />
        {[
          ["Call customer", createPhoneUrl(enquiry.customerPhone)],
          ["Email customer", createEmailUrl(enquiry.customerEmail)],
          [
            "WhatsApp customer",
            createWhatsAppUrl(
              enquiry.whatsappNumber || enquiry.customerPhone,
              `Hello ${enquiry.customerName}, regarding your enquiry ${enquiry.referenceNumber}.`,
            ),
          ],
        ]
          .filter(([, href]) => href)
          .map(([label, href]) => (
            <a className={linkClass} key={label} href={href}>
              {label}
            </a>
          ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <dl className="grid gap-5 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold text-slate-500 uppercase">
                  {label}
                </dt>
                <dd className="mt-1 break-words">
                  {value === undefined || value === "" ? "Not provided" : value}
                </dd>
              </div>
            ))}
          </dl>
          <h2 className="mt-6 font-bold">Customer message</h2>
          <p className="mt-2 whitespace-pre-wrap">
            {enquiry.message || "No additional message."}
          </p>
        </div>
        <form
          className="space-y-5 rounded-xl border border-slate-200 bg-white p-6"
          onSubmit={handleSubmit(async (values) => {
            setMessage("");
            try {
              const updated = await salesFetch<Enquiry>(
                `/api/quote-requests/${enquiry.id}`,
                "PUT",
                values,
              );
              reset({ ...values, version: updated.version });
              setMessage("Enquiry saved.");
              router.refresh();
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Save failed.");
            }
          })}
        >
          <h2 className="text-lg font-bold">Manage enquiry</h2>
          <Field label="Status">
            <select className={inputClass} {...register("status")}>
              {enquiryStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Source">
            <select className={inputClass} {...register("source")}>
              {enquirySources.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Assigned admin">
            <select className={inputClass} {...register("assignedTo")}>
              <option value="">Unassigned</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Internal admin notes"
            error={errors.adminNotes?.message}
          >
            <textarea
              rows={8}
              className={inputClass}
              {...register("adminNotes")}
            />
          </Field>
          <p className="text-xs text-slate-500">
            These notes are only visible to administrators.
          </p>
          {message && <p role="status">{message}</p>}
          <button className={buttonClass} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
      <Link
        className={`${linkClass} mt-6 inline-block`}
        href="/admin/sales/enquiries"
      >
        Back to enquiries
      </Link>
    </>
  );
}
