"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { maintenanceRequestSchema } from "@/lib/validations/maintenance";
import { salesFetch } from "@/components/sales/client-api";
import { Field, Section, inputClass, buttonClass } from "@/components/sales/ui";
import { createWhatsAppUrl } from "@/lib/utils/contact";
type I = z.input<typeof maintenanceRequestSchema>;
export function MaintenanceRequestForm({
  whatsappNumber,
}: {
  whatsappNumber: string;
}) {
  const [done, setDone] = useState<{ referenceNumber: string }>();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<I>({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: {
      equipmentSource: "unknown",
      serviceType: "repair",
      issueCategory: "unknown",
      equipmentOperationalStatus: "unknown",
      urgency: "normal",
      preferredContactMethod: "phone",
      sizeUnit: "m",
      warrantyClaimed: false,
      country: "Nigeria",
      source: "website",
    },
  });
  if (done) {
    const w = createWhatsAppUrl(
      whatsappNumber,
      `Hello, I submitted maintenance request ${done.referenceNumber}.`,
    );
    return (
      <div className="border-success-200 bg-success-50 rounded-2xl border p-8">
        <h2 className="text-2xl font-bold">
          Your maintenance request has been received.
        </h2>
        <p className="my-4 text-xl font-semibold">
          Reference: {done.referenceNumber}
        </p>
        {w && (
          <a
            className={`${buttonClass} mt-5`}
            href={w}
            target="_blank"
            rel="noreferrer"
          >
            Contact us on WhatsApp
          </a>
        )}
      </div>
    );
  }
  const input = (n: keyof I, l: string, t = "text", h?: string) => (
    <Field label={l} hint={h} error={errors[n]?.message as string}>
      <input
        className={inputClass}
        type={t}
        {...register(
          n,
          t === "number"
            ? { setValueAs: (v: string) => (v === "" ? undefined : Number(v)) }
            : {},
        )}
      />
    </Field>
  );
  const select = (n: keyof I, l: string, vals: string[]) => (
    <Field label={l} error={errors[n]?.message as string}>
      <select className={inputClass} {...register(n)}>
        <option value="">Choose…</option>
        {vals.map((v) => (
          <option key={v}>{v.replaceAll("-", " ")}</option>
        ))}
      </select>
    </Field>
  );
  return (
    <form
      className="space-y-7"
      onSubmit={handleSubmit(async (v) => {
        setError("");
        try {
          setDone(await salesFetch("/api/maintenance-requests", "POST", v));
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Unable to submit request.",
          );
        }
      })}
    >
      <Section title="Your contact information">
        {input("customerName", "Full name *")}
        {input("companyName", "Company / organization")}
        {input("customerEmail", "Email", "email")}
        {input("customerPhone", "Phone", "tel")}
        {input("whatsappNumber", "WhatsApp", "tel")}
      </Section>
      <Section title="Your LED screen">
        {select("equipmentSource", "Was this screen installed by us?", [
          "our-installation",
          "external-installation",
          "unknown",
        ])}
        {input("screenBrand", "Brand (if known)")}
        {input("screenModel", "Model (if known)")}
        {input("pixelPitch", "Pixel pitch", "text", "Leave blank if unsure.")}
        {select("indoorOutdoor", "Indoor or outdoor", [
          "indoor",
          "outdoor",
          "both",
          "not-sure",
        ])}
        {input(
          "screenWidth",
          "Approximate width",
          "number",
          "An estimate is fine.",
        )}
        {input("screenHeight", "Approximate height", "number")}
      </Section>
      <Section title="What is wrong?">
        {select("serviceType", "Service needed", [
          "repair",
          "preventive-maintenance",
          "inspection",
          "troubleshooting",
          "emergency-service",
          "screen-calibration",
          "configuration",
          "module-replacement",
          "power-system-service",
          "controller-service",
          "cleaning",
          "other",
        ])}
        {select("issueCategory", "Issue category", [
          "no-display",
          "partial-display",
          "dead-modules",
          "flickering",
          "color-problem",
          "brightness-problem",
          "power-failure",
          "controller-problem",
          "receiving-card",
          "processor-problem",
          "cable-connection",
          "physical-damage",
          "water-damage",
          "overheating",
          "unknown",
          "other",
        ])}
        {input("issueTitle", "Short issue title")}
        {input("issueDescription", "Describe the problem")}
        {input("symptoms", "Symptoms or warning signs")}
        {select("equipmentOperationalStatus", "Current status", [
          "working-with-issues",
          "partially-working",
          "completely-down",
          "intermittent",
          "unknown",
        ])}
        {select("urgency", "Urgency", [
          "normal",
          "high",
          "urgent",
          "emergency",
        ])}
      </Section>
      <Section title="Location and service">
        {input("venueName", "Venue")}
        {input("address", "Address")}
        {input("city", "City")}
        {input("state", "State")}
        {input("preferredServiceDate", "Preferred service date", "date")}
        {select("preferredContactMethod", "Preferred contact method", [
          "phone",
          "whatsapp",
          "email",
        ])}
        {input("message", "Additional message")}
      </Section>
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>
      )}
      <button className={buttonClass} disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Request Maintenance / Repair"}
      </button>
    </form>
  );
}
