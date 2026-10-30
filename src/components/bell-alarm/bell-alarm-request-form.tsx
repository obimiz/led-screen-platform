"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { bellAlarmRequestSchema } from "@/lib/validations/bell-alarm";
import { salesFetch } from "@/components/sales/client-api";
import { Field, Section, inputClass, buttonClass } from "@/components/sales/ui";
import { createWhatsAppUrl } from "@/lib/utils/contact";
type I = z.input<typeof bellAlarmRequestSchema>;
export function BellAlarmRequestForm({
  product,
  whatsappNumber,
}: {
  product?: { slug: string; name: string; description: string };
  whatsappNumber: string;
}) {
  const [done, setDone] = useState<{ referenceNumber: string }>();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<I>({
    resolver: zodResolver(bellAlarmRequestSchema),
    defaultValues: {
      selectedProductSlug: product?.slug || "",
      currency: "NGN",
      country: "Nigeria",
      requestType: "consultation",
      intendedApplication: "other",
      operatingModePreference: "hybrid",
      preferredContactMethod: "phone",
      source: product ? "product-page" : "website",
      numberOfBuildings: 0,
      numberOfZones: 0,
      numberOfBellPoints: 0,
      numberOfSpeakers: 0,
    },
  });
  if (done) {
    const w = createWhatsAppUrl(
      whatsappNumber,
      `Hello, I submitted electronic bell/alarm request ${done.referenceNumber}.`,
    );
    return (
      <div className="border-success-200 bg-success-50 rounded-2xl border p-8">
        <h2 className="text-2xl font-bold">
          Your electronic bell/alarm request has been received.
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
            ? { setValueAs: (v: string) => (v === "" ? 0 : Number(v)) }
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
          setDone(await salesFetch("/api/bell-alarm-requests", "POST", v));
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Unable to submit request.",
          );
        }
      })}
    >
      <input type="hidden" {...register("selectedProductSlug")} />
      {product && (
        <div className="bg-brand-50 rounded-xl p-5">
          <p className="text-xs font-bold uppercase">Selected system</p>
          <h2 className="mt-1 text-xl font-bold">{product.name}</h2>
          <p className="mt-2 text-sm">{product.description}</p>
        </div>
      )}
      <Section title="Your organisation">
        {input("customerName", "Full name *")}
        {input("companyName", "Organisation")}
        {input("organizationType", "Organisation type")}
        {input("customerEmail", "Email", "email")}
        {input("customerPhone", "Phone", "tel")}
        {input("whatsappNumber", "WhatsApp", "tel")}
      </Section>
      <Section title="System requirements">
        {select("requestType", "What do you need?", [
          "product-enquiry",
          "new-installation",
          "upgrade",
          "replacement",
          "inspection",
          "repair",
          "consultation",
          "other",
        ])}
        {input(
          "systemType",
          "System type",
          "text",
          "For example, programmable school bell or institutional alarm.",
        )}
        {select("intendedApplication", "Intended application", [
          "church",
          "school",
          "office",
          "factory",
          "hotel",
          "hospital",
          "estate",
          "institution",
          "event-centre",
          "warehouse",
          "commercial-building",
          "other",
        ])}
        {select("operatingModePreference", "Preferred operating mode", [
          "manual",
          "automatic",
          "scheduled",
          "remote",
          "hybrid",
        ])}
        {input("numberOfBuildings", "Number of buildings", "number")}
        {input("numberOfZones", "Number of zones", "number")}
        {input("numberOfBellPoints", "Bell/alarm points", "number")}
        {input("numberOfSpeakers", "Speakers", "number")}
        {input("scheduleRequirements", "Schedule requirements")}
      </Section>
      <Section title="Location and follow-up">
        {input("venueName", "Venue")}
        {input("address", "Address")}
        {input("city", "City")}
        {input("state", "State")}
        {input("preferredDate", "Preferred date", "date")}
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
        {isSubmitting ? "Submitting…" : "Request Quote"}
      </button>
    </form>
  );
}
