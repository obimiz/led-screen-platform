"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  useForm,
  useWatch,
  type FieldError,
  type UseFormRegister,
} from "react-hook-form";

import {
  businessSettingsSchema,
  type BusinessSettingsInput,
  type BusinessSettingsValues,
} from "@/lib/validations/business-settings";
import type { BusinessSettings } from "@/types/business-settings";

type ApiResult = { success: boolean; message: string; data?: BusinessSettings };
type FieldName = keyof BusinessSettingsInput;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <legend className="px-1 text-lg font-bold text-slate-950">{title}</legend>
      <p className="mb-5 text-sm leading-6 text-slate-500">{description}</p>
      {children}
    </fieldset>
  );
}

function TextField({
  name,
  label,
  register,
  error,
  type = "text",
  placeholder,
  helper,
}: {
  name: FieldName;
  label: string;
  register: UseFormRegister<BusinessSettingsInput>;
  error?: FieldError;
  type?: "text" | "email" | "url" | "tel";
  placeholder?: string;
  helper?: string;
}) {
  const errorId = `${name}-error`;
  const helperId = `${name}-helper`;
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-slate-800">
        {label}
      </label>
      <input
        id={name}
        type={type}
        {...register(name)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helper ? helperId : undefined}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
      />
      {helper && !error && (
        <p id={helperId} className="mt-1.5 text-xs leading-5 text-slate-500">
          {helper}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-600">
          {error.message}
        </p>
      )}
    </div>
  );
}

function ImagePreview({ url, label }: { url: string; label: string }) {
  if (!url) return null;
  return (
    <div className="mt-3 flex items-center gap-3">
      <span
        role="img"
        aria-label={`${label} preview`}
        style={{ backgroundImage: `url(${JSON.stringify(url).slice(1, -1)})` }}
        className="size-14 rounded-lg border border-slate-200 bg-contain bg-center bg-no-repeat"
      />
      <span className="text-xs text-slate-500">Current preview</span>
    </div>
  );
}

export function BusinessSettingsForm({
  initialValues,
}: {
  initialValues: BusinessSettings;
}) {
  const [notice, setNotice] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BusinessSettingsInput, unknown, BusinessSettingsValues>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: initialValues,
  });
  const logoUrl = useWatch({ control, name: "logoUrl" }) ?? "";
  const faviconUrl = useWatch({ control, name: "faviconUrl" }) ?? "";

  async function onSubmit(values: BusinessSettingsValues) {
    setNotice(null);
    try {
      const response = await fetch("/api/settings/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await response.json()) as ApiResult;
      if (!response.ok || !body.data) {
        setNotice({
          kind: "error",
          message: body.message || "Unable to save business settings.",
        });
        return;
      }
      reset(body.data);
      setNotice({ kind: "success", message: body.message });
    } catch {
      setNotice({
        kind: "error",
        message: "Unable to save business settings. Please try again.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className={
            notice.kind === "success"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              : "rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          }
        >
          {notice.message}
        </div>
      )}
      <Section
        title="Company profile"
        description="The primary identity shown throughout the platform."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="businessName"
            label="Business name"
            register={register}
            error={errors.businessName}
          />
          <TextField
            name="shortName"
            label="Short name"
            register={register}
            error={errors.shortName}
          />
          <TextField
            name="tagline"
            label="Tagline"
            register={register}
            error={errors.tagline}
          />
          <div className="sm:col-span-2">
            <label
              htmlFor="description"
              className="text-sm font-semibold text-slate-800"
            >
              Business description
            </label>
            <textarea
              id="description"
              rows={5}
              {...register("description")}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "description-error" : undefined
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
            {errors.description && (
              <p
                id="description-error"
                role="alert"
                className="mt-1.5 text-sm text-red-600"
              >
                {errors.description.message}
              </p>
            )}
          </div>
        </div>
      </Section>
      <Section
        title="Branding"
        description="Use direct HTTPS image URLs for now. Media uploads will be added in a later module."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <TextField
              name="logoUrl"
              label="Logo URL"
              type="url"
              register={register}
              error={errors.logoUrl}
              placeholder="https://…"
            />
            <ImagePreview url={logoUrl} label="Logo" />
          </div>
          <div>
            <TextField
              name="faviconUrl"
              label="Favicon URL"
              type="url"
              register={register}
              error={errors.faviconUrl}
              placeholder="https://…"
            />
            <ImagePreview url={faviconUrl} label="Favicon" />
          </div>
        </div>
      </Section>
      <Section
        title="Contact information"
        description="Public enquiry channels used in the footer and future contact experiences."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="primaryEmail"
            label="Primary email"
            type="email"
            register={register}
            error={errors.primaryEmail}
          />
          <TextField
            name="secondaryEmail"
            label="Secondary email"
            type="email"
            register={register}
            error={errors.secondaryEmail}
          />
          <TextField
            name="primaryPhone"
            label="Primary phone"
            type="tel"
            register={register}
            error={errors.primaryPhone}
          />
          <TextField
            name="secondaryPhone"
            label="Secondary phone"
            type="tel"
            register={register}
            error={errors.secondaryPhone}
          />
          <TextField
            name="whatsappNumber"
            label="WhatsApp number"
            type="tel"
            register={register}
            error={errors.whatsappNumber}
            helper="Include the country code, for example +234…"
          />
        </div>
      </Section>
      <Section
        title="Address"
        description="The physical business location and optional map destination."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="addressLine1"
            label="Address line 1"
            register={register}
            error={errors.addressLine1}
          />
          <TextField
            name="addressLine2"
            label="Address line 2"
            register={register}
            error={errors.addressLine2}
          />
          <TextField
            name="city"
            label="City"
            register={register}
            error={errors.city}
          />
          <TextField
            name="state"
            label="State"
            register={register}
            error={errors.state}
          />
          <TextField
            name="country"
            label="Country"
            register={register}
            error={errors.country}
          />
          <TextField
            name="postalCode"
            label="Postal code"
            register={register}
            error={errors.postalCode}
          />
          <div className="sm:col-span-2">
            <TextField
              name="googleMapsUrl"
              label="Google Maps URL"
              type="url"
              register={register}
              error={errors.googleMapsUrl}
            />
          </div>
        </div>
      </Section>
      <Section
        title="Business hours"
        description="Enter a clear weekly schedule that can be displayed publicly later."
      >
        <label
          htmlFor="businessHours"
          className="text-sm font-semibold text-slate-800"
        >
          Opening hours
        </label>
        <textarea
          id="businessHours"
          rows={5}
          {...register("businessHours")}
          placeholder={
            "Monday–Friday: 8:00 AM–5:00 PM\nSaturday: 9:00 AM–2:00 PM"
          }
          aria-invalid={Boolean(errors.businessHours)}
          aria-describedby={
            errors.businessHours ? "business-hours-error" : undefined
          }
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
        />
        {errors.businessHours && (
          <p
            id="business-hours-error"
            role="alert"
            className="mt-1.5 text-sm text-red-600"
          >
            {errors.businessHours.message}
          </p>
        )}
      </Section>
      <Section
        title="Social media"
        description="Only links entered here will appear in public contact areas."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="facebookUrl"
            label="Facebook"
            type="url"
            register={register}
            error={errors.facebookUrl}
          />
          <TextField
            name="instagramUrl"
            label="Instagram"
            type="url"
            register={register}
            error={errors.instagramUrl}
          />
          <TextField
            name="youtubeUrl"
            label="YouTube"
            type="url"
            register={register}
            error={errors.youtubeUrl}
          />
          <TextField
            name="linkedinUrl"
            label="LinkedIn"
            type="url"
            register={register}
            error={errors.linkedinUrl}
          />
          <TextField
            name="xUrl"
            label="X / Twitter"
            type="url"
            register={register}
            error={errors.xUrl}
          />
          <TextField
            name="tiktokUrl"
            label="TikTok"
            type="url"
            register={register}
            error={errors.tiktokUrl}
          />
        </div>
      </Section>
      <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <p className="hidden text-sm text-slate-500 sm:block">
          {isDirty ? "You have unsaved changes." : "All changes are saved."}
        </p>
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {isSubmitting ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
