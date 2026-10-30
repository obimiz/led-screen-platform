"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { createQuoteRequestSchema } from "@/lib/validations/sales";
import {
  customerTypes,
  projectTypes,
  salesCurrencies,
  defaultSalesCurrency,
} from "@/lib/sales/constants";
import { createWhatsAppUrl } from "@/lib/utils/contact";
import { salesFetch } from "./client-api";
import { Field, Section, inputClass, buttonClass } from "./ui";
type Input = z.input<typeof createQuoteRequestSchema>;
type Confirmation = {
  referenceNumber: string;
  customerName: string;
  productName: string;
  projectType: string;
  quantity: number;
};
export function QuoteRequestForm({
  product,
  whatsappNumber,
}: {
  product?: {
    slug: string;
    name: string;
    description: string;
    indoorOutdoor?: string;
    pixelPitch?: string;
  };
  whatsappNumber: string;
}) {
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input, unknown, z.output<typeof createQuoteRequestSchema>>({
    resolver: zodResolver(createQuoteRequestSchema),
    defaultValues: {
      productSlug: product?.slug ?? "",
      customerType: "individual",
      projectType: "purchase",
      quantity: 1,
      sizeUnit: "m",
      preferredContactMethod: "phone",
      budgetCurrency: defaultSalesCurrency,
      indoorOutdoor:
        product?.indoorOutdoor === "indoor" ||
        product?.indoorOutdoor === "outdoor"
          ? product.indoorOutdoor
          : "",
      preferredPixelPitch: product?.pixelPitch ?? "",
    },
  });
  if (confirmation) {
    const url = createWhatsAppUrl(
      whatsappNumber,
      `Hello, I submitted quotation request ${confirmation.referenceNumber}.`,
    );
    return (
      <div
        className="border-success-200 bg-success-50 rounded-2xl border p-8"
        role="status"
      >
        <meta name="robots" content="noindex, nofollow" />
        <h2 className="text-2xl font-bold">
          Your quotation request has been received.
        </h2>
        <p className="my-4 text-xl font-semibold">
          Reference: {confirmation.referenceNumber}
        </p>
        <p>
          Thank you, {confirmation.customerName}. Our team will review your
          requirements and contact you using your preferred method.
        </p>
        <p className="my-4">
          {confirmation.productName || "General enquiry"} ·{" "}
          {confirmation.projectType} · Quantity: {confirmation.quantity}
        </p>
        <p className="text-sm">
          Please keep this reference for future correspondence.
        </p>
        {url && (
          <a
            className={`${buttonClass} mt-6`}
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            Contact us on WhatsApp
          </a>
        )}
      </div>
    );
  }
  const field = (
    name: keyof Input,
    label: string,
    type = "text",
    hint?: string,
  ) => (
    <Field key={name} label={label} hint={hint} error={errors[name]?.message}>
      <input
        className={inputClass}
        type={type}
        step={type === "number" ? "0.01" : undefined}
        {...register(
          name,
          type === "number"
            ? { setValueAs: (v: string) => (v === "" ? undefined : Number(v)) }
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
    <Field key={name} label={label} error={errors[name]?.message} hint={hint}>
      <select className={inputClass} {...register(name)}>
        {values.map((v) => (
          <option key={v} value={v}>
            {v ? v.replaceAll("-", " ") : "Not sure / no preference"}
          </option>
        ))}
      </select>
    </Field>
  );
  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        setError("");
        try {
          setConfirmation(
            await salesFetch<Confirmation>(
              "/api/quote-requests",
              "POST",
              values,
            ),
          );
        } catch (e) {
          setError(
            e instanceof Error
              ? e.message
              : "Submission failed. Please try again.",
          );
        }
      })}
      className="space-y-7"
    >
      <input type="hidden" {...register("productSlug")} />
      {product && (
        <div className="bg-brand-50 rounded-xl p-5">
          <p className="text-xs font-bold uppercase">Selected product</p>
          <h2 className="mt-1 text-xl font-bold">{product.name}</h2>
          <p className="mt-2 text-sm">{product.description}</p>
        </div>
      )}
      <Section title="Your contact information">
        {field("customerName", "Full name *")}
        {field("companyName", "Company / organization")}
        {field("customerEmail", "Email", "email")}
        {field(
          "customerPhone",
          "Phone number",
          "tel",
          "Include your country code, e.g. +234.",
        )}
        {field("whatsappNumber", "WhatsApp number", "tel")}
        {select("customerType", "Customer type", customerTypes)}
        <p className="text-sm text-slate-500 sm:col-span-2">
          Provide at least one contact method. We only need enough information
          to get back to you.
        </p>
      </Section>
      <Section title="Tell us about your project">
        {select("projectType", "Project type", projectTypes)}
        {field(
          "intendedUse",
          "What will you use the display for?",
          "text",
          "For example, church services, advertising or a meeting room.",
        )}
        {select(
          "indoorOutdoor",
          "Where will it be used?",
          ["", "indoor", "outdoor", "both", "not-sure"],
          "Choose indoor for a covered room or outdoor for exposure to weather.",
        )}
        {field("requiredWidth", "Approximate width", "number")}
        {field("requiredHeight", "Approximate height", "number")}
        {select(
          "sizeUnit",
          "Measurement unit",
          ["m", "ft"],
          "m = metres; ft = feet. Leave dimensions blank if you are unsure.",
        )}
        {field("quantity", "Quantity *", "number")}
        {field(
          "preferredPixelPitch",
          "Preferred pixel pitch",
          "text",
          "If you're not sure, leave this blank and our team will recommend one.",
        )}
      </Section>
      <Section title="Location">
        {field("installationLocation", "Installation / delivery address")}
        {field("city", "City")}
        {field("state", "State / region")}
        {field("country", "Country")}
      </Section>
      <Section title="Timing and budget (optional)">
        {field("eventDate", "Event / required date", "date")}
        <Field label="Estimated budget" error={errors.budget?.message}>
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            {...register("budget", {
              setValueAs: (v: string) =>
                v === "" ? undefined : Math.round(Number(v) * 100),
            })}
          />
        </Field>
        {select("budgetCurrency", "Budget currency", salesCurrencies)}
      </Section>
      <Section title="Anything else we should know?">
        <Field
          label="Message / project description"
          error={errors.message?.message}
        >
          <textarea className={inputClass} rows={5} {...register("message")} />
        </Field>
        {select("preferredContactMethod", "How should we contact you?", [
          "phone",
          "whatsapp",
          "email",
        ])}
      </Section>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </p>
      )}
      <button disabled={isSubmitting} className={buttonClass}>
        {isSubmitting ? "Submitting…" : "Submit quotation request"}
      </button>
    </form>
  );
}
