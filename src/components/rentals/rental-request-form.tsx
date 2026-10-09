"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { createRentalRequestSchema } from "@/lib/validations/rentals";
import { rentalEventTypes } from "@/lib/rentals/constants";
import { createWhatsAppUrl } from "@/lib/utils/contact";
import { salesFetch } from "@/components/sales/client-api";
import { Field, Section, inputClass, buttonClass } from "@/components/sales/ui";
type Input = z.input<typeof createRentalRequestSchema>;
export function RentalRequestForm({
  product,
  whatsappNumber,
}: {
  product?: {
    slug: string;
    name: string;
    description: string;
    pixelPitch?: string;
  };
  whatsappNumber: string;
}) {
  const [result, setResult] = useState<{
    referenceNumber: string;
    eventName: string;
    eventType: string;
  }>();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<Input>({
    resolver: zodResolver(createRentalRequestSchema),
    defaultValues: {
      productSlug: product?.slug ?? "",
      eventType: "other",
      eventName: "",
      eventTypeOther: "",
      eventStartDate: "",
      eventEndDate: "",
      setupDate: "",
      teardownDate: "",
      quantity: 1,
      sizeUnit: "m",
      customerType: "individual",
      preferredContactMethod: "phone",
      budgetCurrency: "NGN",
      indoorOutdoor: "",
      installationSupportRequired: false,
      operatorRequired: false,
      generatorPowerRequired: false,
      transportationRequired: false,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      whatsappNumber: "",
      companyName: "",
      eventDescription: "",
      venueName: "",
      venueAddress: "",
      city: "",
      state: "",
      country: "Nigeria",
      preferredPixelPitch: product?.pixelPitch ?? "",
      accessoriesRequested: "",
      message: "",
    },
  });
  if (result) {
    const whatsapp = createWhatsAppUrl(
      whatsappNumber,
      `Hello, I submitted rental request ${result.referenceNumber}.`,
    );
    return (
      <div
        className="rounded-2xl border border-success-200 bg-success-50 p-8"
        role="status"
      >
        <h2 className="text-2xl font-bold">
          Your rental request has been received.
        </h2>
        <p className="my-4 text-xl font-semibold">
          Reference: {result.referenceNumber}
        </p>
        <p>
          {result.eventName || "Your event"} · {result.eventType}
        </p>
        <p className="mt-4">
          Availability will be confirmed by our team after reviewing your dates
          and equipment requirements.
        </p>
        {whatsapp && (
          <a
            className={`${buttonClass} mt-6`}
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            Contact us on WhatsApp
          </a>
        )}
      </div>
    );
  }
  const input = (
    name: keyof Input,
    label: string,
    type = "text",
    hint?: string,
  ) => (
    <Field label={label} hint={hint} error={errors[name]?.message as string}>
      <input
        className={inputClass}
        type={type}
        {...register(
          name,
          type === "number"
            ? {
                setValueAs: (v: string) =>
                  v === ""
                    ? undefined
                    : name === "budget"
                      ? Math.round(Number(v) * 100)
                      : Number(v),
              }
            : {},
        )}
      />
    </Field>
  );
  const select = (
    name: keyof Input,
    label: string,
    values: readonly string[],
    hint?: string,
  ) => (
    <Field label={label} hint={hint} error={errors[name]?.message as string}>
      <select className={inputClass} {...register(name)}>
        <option value="">Choose…</option>
        {values.map((v) => (
          <option key={v}>{v.replaceAll("-", " ")}</option>
        ))}
      </select>
    </Field>
  );
  return (
    <form
      className="space-y-7"
      onSubmit={handleSubmit(async (values) => {
        setError("");
        try {
          setResult(await salesFetch("/api/rental-requests", "POST", values));
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Unable to submit request.",
          );
        }
      })}
    >
      <input type="hidden" {...register("productSlug")} />
      {product && (
        <div className="rounded-xl bg-brand-50 p-5">
          <p className="text-xs font-bold uppercase">
            Selected rentable screen
          </p>
          <h2 className="mt-1 text-xl font-bold">{product.name}</h2>
          <p className="mt-2 text-sm">{product.description}</p>
        </div>
      )}
      <Section title="Your contact information">
        {input("customerName", "Full name *")}
        {input("companyName", "Company / organization")}
        {input("customerEmail", "Email", "email")}
        {input("customerPhone", "Phone", "tel", "Include your country code.")}
        {input("whatsappNumber", "WhatsApp number", "tel")}
        {select("customerType", "Customer type", [
          "individual",
          "business",
          "church",
          "school",
          "hotel",
          "event-organizer",
          "agency",
          "institution",
          "other",
        ])}
      </Section>
      <Section title="Event details">
        {select("eventType", "Event type", rentalEventTypes)}
        {watch("eventType") === "other" &&
          input("eventTypeOther", "Describe the event type *")}
        {input("eventName", "Event name")}
        {input("expectedAudience", "Expected audience", "number")}
        {
          <Field
            label="Event description"
            error={errors.eventDescription?.message as string}
          >
            <textarea
              rows={4}
              className={inputClass}
              {...register("eventDescription")}
            />
          </Field>
        }
      </Section>
      <Section title="Event dates and venue">
        {input("eventStartDate", "Event start date *", "date")}
        {input("eventEndDate", "Event end date *", "date")}
        {input("eventStartTime", "Event start time", "time")}
        {input("eventEndTime", "Event end time", "time")}
        {input("setupDate", "Preferred setup date", "date")}
        {input("teardownDate", "Preferred teardown date", "date")}
        {input("venueName", "Venue name")}
        {input("venueAddress", "Venue address")}
        {input("city", "City")}
        {input("state", "State / region")}
        {input("country", "Country")}
        {select(
          "indoorOutdoor",
          "Indoor or outdoor",
          ["indoor", "outdoor", "both"],
          "Choose outdoor if the screen will be exposed to weather.",
        )}
      </Section>
      <Section title="LED screen requirement">
        {input(
          "requiredWidth",
          "Approximate width",
          "number",
          "Leave blank if unsure.",
        )}
        {input(
          "requiredHeight",
          "Approximate height",
          "number",
          "Leave blank if unsure.",
        )}
        {select("sizeUnit", "Measurement unit", ["m", "ft"])}
        {input("quantity", "Quantity *", "number")}
        {input(
          "preferredPixelPitch",
          "Preferred pixel pitch",
          "text",
          "Leave blank if you're unsure. Our team can recommend the best option.",
        )}
        {input("accessoriesRequested", "Accessories needed")}
      </Section>
      <Section title="Optional support">
        {(
          [
            ["installationSupportRequired", "Installation / setup support"],
            ["operatorRequired", "LED operator"],
            ["transportationRequired", "Transportation"],
            ["generatorPowerRequired", "Generator / power support"],
          ] as const
        ).map(([name, label]) => (
          <label key={name} className="flex items-center gap-3 text-sm">
            <input type="checkbox" {...register(name)} />
            {label}
          </label>
        ))}
      </Section>
      <Section title="Budget and contact preference">
        {input(
          "budget",
          "Estimated budget",
          "number",
          "Enter the amount in the selected currency, for example 1500000.00.",
        )}
        {input("budgetCurrency", "Budget currency")}
        {select("preferredContactMethod", "Preferred contact method", [
          "phone",
          "whatsapp",
          "email",
        ])}
      </Section>
      <Field
        label="Additional message"
        error={errors.message?.message as string}
      >
        <textarea rows={5} className={inputClass} {...register("message")} />
      </Field>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </p>
      )}
      <button className={buttonClass} disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Request Rental Quote"}
      </button>
    </form>
  );
}
