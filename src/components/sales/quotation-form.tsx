"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  createQuotationSchema,
  type QuotationInput,
} from "@/lib/validations/sales";
import {
  calculateQuotationTotals,
  formatMoney,
} from "@/lib/sales/calculations";
import { defaultSalesCurrency, salesCurrencies } from "@/lib/sales/constants";
import type { CatalogueOption, Enquiry, Quotation } from "@/types/sales";
import { salesFetch } from "./client-api";
import {
  Field,
  Section,
  SalesHeading,
  inputClass,
  buttonClass,
  linkClass,
} from "./ui";
type Input = z.input<typeof createQuotationSchema>;
function productItem(p: CatalogueOption) {
  return {
    productId: p.id,
    itemType:
      p.productType === "led-accessory"
        ? ("accessory" as const)
        : ("led-screen" as const),
    name: p.name,
    description: p.description,
    quantity: 1,
    unit: "unit",
    unitPrice: p.price ?? 0,
    discount: 0,
  };
}
export function QuotationForm({
  quotation,
  enquiry,
  selectedProduct,
}: {
  quotation?: Quotation;
  enquiry?: Enquiry;
  selectedProduct?: CatalogueOption;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<CatalogueOption[]>([]);
  const [searching, setSearching] = useState(false);
  const defaults: Input = quotation
    ? { ...quotation, validUntil: quotation.validUntil.slice(0, 10) }
    : {
        quoteRequestId: enquiry?.id ?? "",
        customer: {
          name: enquiry?.customerName ?? "",
          companyName: enquiry?.companyName ?? "",
          email: enquiry?.customerEmail ?? "",
          phone: enquiry?.customerPhone ?? "",
          whatsappNumber: enquiry?.whatsappNumber ?? "",
        },
        billingAddress: "",
        deliveryAddress: enquiry
          ? [
              enquiry.installationLocation,
              enquiry.city,
              enquiry.state,
              enquiry.country,
            ]
              .filter(Boolean)
              .join(", ")
          : "",
        items: selectedProduct
          ? [
              {
                ...productItem(selectedProduct),
                quantity: enquiry?.quantity ?? 1,
              },
            ]
          : [
              {
                itemType: "custom",
                productId: "",
                name: "",
                description: "",
                quantity: 1,
                unit: "unit",
                unitPrice: 0,
                discount: 0,
              },
            ],
        discountType: "none",
        discountValue: 0,
        taxRate: 0,
        deliveryFee: 0,
        installationFee: 0,
        otherCharges: 0,
        currency:
          selectedProduct &&
          salesCurrencies.some((c) => c === selectedProduct.currency)
            ? (selectedProduct.currency as QuotationInput["currency"])
            : defaultSalesCurrency,
        validityDays: 30,
        validUntil: "",
        notes: enquiry
          ? [
              `Enquiry ${enquiry.referenceNumber}`,
              enquiry.projectType,
              enquiry.intendedUse,
              enquiry.requiredWidth
                ? `Width: ${enquiry.requiredWidth} ${enquiry.sizeUnit}`
                : "",
              enquiry.requiredHeight
                ? `Height: ${enquiry.requiredHeight} ${enquiry.sizeUnit}`
                : "",
              enquiry.preferredPixelPitch
                ? `Pixel pitch: ${enquiry.preferredPixelPitch}`
                : "",
              enquiry.eventDate ? `Required: ${enquiry.eventDate}` : "",
              enquiry.message,
            ]
              .filter(Boolean)
              .join("\n")
          : "",
        terms: "",
      };
  const {
    register,
    setValue,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input, unknown, QuotationInput>({
    resolver: zodResolver(createQuotationSchema),
    defaultValues: defaults,
  });
  const items = useFieldArray({ control, name: "items" });
  const values = useWatch({ control });
  const currency = values.currency || defaultSalesCurrency;
  let totals: ReturnType<typeof calculateQuotationTotals> | undefined;
  let calculationError = "";
  const parsed = createQuotationSchema.safeParse({
    ...values,
    customer: { name: "Preview", email: "preview@example.com" },
  });
  if (parsed.success) {
    try {
      totals = calculateQuotationTotals(parsed.data);
    } catch (e) {
      calculationError = e instanceof Error ? e.message : "Invalid totals";
    }
  }
  type MoneyName =
    | "deliveryFee"
    | "installationFee"
    | "otherCharges"
    | "discountValue"
    | `items.${number}.unitPrice`
    | `items.${number}.discount`;
  const money = (name: MoneyName, label: string) => (
    <Field label={label}>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <>
            <input
              className={inputClass}
              type="number"
              min="0"
              step="0.01"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={field.value == null ? "" : Number(field.value) / 100}
              onChange={(e) =>
                field.onChange(
                  e.target.value === ""
                    ? 0
                    : Math.round(Number(e.target.value) * 100),
                )
              }
            />
            {fieldState.error && (
              <span className="text-xs text-red-700">
                {fieldState.error.message}
              </span>
            )}
          </>
        )}
      />
    </Field>
  );
  return (
    <>
      <SalesHeading
        title={
          quotation ? `Edit ${quotation.quotationNumber}` : "New quotation"
        }
        description={
          enquiry
            ? `Prepared from ${enquiry.referenceNumber}. Review the customer details and complete pricing.`
            : "Enter customer details and add catalogue products or custom services."
        }
      />
      <form
        className="space-y-7"
        onSubmit={handleSubmit(async (input) => {
          setError("");
          try {
            const result = await salesFetch<Quotation>(
              quotation ? `/api/quotations/${quotation.id}` : "/api/quotations",
              quotation ? "PUT" : "POST",
              {
                ...input,
                ...(quotation ? { version: quotation.version } : {}),
              },
            );
            router.push(`/admin/sales/quotations/${result.id}`);
            router.refresh();
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "Unable to save quotation.",
            );
          }
        })}
      >
        <Section title="Customer">
          {(
            [
              ["name", "Customer name *"],
              ["companyName", "Company / organization"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["whatsappNumber", "WhatsApp"],
            ] as const
          ).map(([key, label]) => (
            <Field
              key={key}
              label={label}
              error={errors.customer?.[key]?.message}
            >
              <input
                className={inputClass}
                type={key === "email" ? "email" : "text"}
                {...register(`customer.${key}`)}
              />
            </Field>
          ))}
          <p className="text-sm text-slate-500">
            Provide at least one contact method.
          </p>
          <Field label="Billing address">
            <textarea
              className={inputClass}
              rows={3}
              {...register("billingAddress")}
            />
          </Field>
          <Field label="Delivery / installation address">
            <textarea
              className={inputClass}
              rows={3}
              {...register("deliveryAddress")}
            />
          </Field>
        </Section>
        <Section title="Currency and validity">
          <Field
            label="Currency"
            hint="All prices below are entered in major units. Catalogue products must match this currency."
          >
            <select className={inputClass} {...register("currency")}>
              {salesCurrencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Validity (days)" error={errors.validityDays?.message}>
            <input
              className={inputClass}
              type="number"
              min="1"
              max="365"
              {...register("validityDays", { valueAsNumber: true })}
            />
          </Field>
          <Field
            label="Valid until (optional override)"
            hint="Leave blank to calculate from today using the validity days."
            error={errors.validUntil?.message}
          >
            <input
              className={inputClass}
              type="date"
              {...register("validUntil")}
            />
          </Field>
        </Section>
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold">Line items</h2>
          <div className="flex flex-wrap gap-2">
            <input
              className={`${inputClass} max-w-md`}
              aria-label="Search catalogue"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search LED screens and accessories"
            />
            <button
              type="button"
              className={buttonClass}
              disabled={searching}
              onClick={async () => {
                setSearching(true);
                setError("");
                try {
                  setProducts(
                    await salesFetch<CatalogueOption[]>(
                      `/api/sales/catalogue?search=${encodeURIComponent(search)}`,
                    ),
                  );
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Search failed.");
                } finally {
                  setSearching(false);
                }
              }}
            >
              {searching ? "Searching…" : "Find products"}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Search returns up to 50 products. A price of zero means pricing
            still needs your review.
          </p>
          {!!products.length && (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-3 text-sm"
                >
                  <div>
                    <strong>{p.name}</strong>
                    <p>
                      {p.productType} · {p.currency} ·{" "}
                      {p.price == null
                        ? "Price on request"
                        : formatMoney(p.price, p.currency)}
                    </p>
                  </div>
                  <button
                    className={linkClass}
                    type="button"
                    onClick={() => {
                      items.append(productItem(p));
                      setProducts([]);
                    }}
                  >
                    Add item
                  </button>
                </div>
              ))}
            </div>
          )}
          {items.fields.map((item, index) => (
            <div
              key={item.id}
              className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">Item {index + 1}</h3>
                <button
                  className="text-sm font-semibold text-red-700"
                  type="button"
                  onClick={() => items.remove(index)}
                >
                  Remove item {index + 1}
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Item type">
                  <select
                    className={inputClass}
                    {...register(`items.${index}.itemType`)}
                    disabled={Boolean(item.productId)}
                  >
                    {(item.productId
                      ? [item.itemType]
                      : ["service", "custom"]
                    ).map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Name"
                  error={errors.items?.[index]?.name?.message}
                >
                  <input
                    className={inputClass}
                    {...register(`items.${index}.name`)}
                  />
                </Field>
                <Field
                  label="Quantity"
                  error={errors.items?.[index]?.quantity?.message}
                >
                  <input
                    className={inputClass}
                    type="number"
                    min="0.001"
                    step="0.001"
                    {...register(`items.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                  />
                </Field>
                <Field
                  label="Unit"
                  error={errors.items?.[index]?.unit?.message}
                >
                  <input
                    className={inputClass}
                    {...register(`items.${index}.unit`)}
                    placeholder="unit, m², job"
                  />
                </Field>
                {money(`items.${index}.unitPrice`, `Unit price (${currency})`)}
                {money(
                  `items.${index}.discount`,
                  `Line discount (${currency})`,
                )}
                <div className="sm:col-span-2">
                  <Field label="Description">
                    <textarea
                      className={inputClass}
                      rows={2}
                      {...register(`items.${index}.description`)}
                    />
                  </Field>
                </div>
              </div>
              <p className="text-right font-semibold">
                Line total:{" "}
                {totals?.items[index]
                  ? formatMoney(totals.items[index].lineTotal, currency)
                  : "Complete item details"}
              </p>
            </div>
          ))}
          {errors.items && (
            <p role="alert" className="text-red-700">
              {errors.items.root?.message ||
                errors.items.message ||
                "Check the line item details."}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {(["service", "custom"] as const).map((type) => (
              <button
                key={type}
                type="button"
                className={buttonClass}
                onClick={() =>
                  items.append({
                    itemType: type,
                    productId: "",
                    name: "",
                    description: "",
                    quantity: 1,
                    unit: "unit",
                    unitPrice: 0,
                    discount: 0,
                  })
                }
              >
                Add {type} item
              </button>
            ))}
          </div>
        </section>
        <Section title="Discount, tax and fees">
          <Field label="Quotation discount">
            <select
              className={inputClass}
              {...register("discountType", {
                onChange: () => setValue("discountValue", 0),
              })}
            >
              {["none", "fixed", "percentage"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          {values.discountType === "fixed" ? (
            money("discountValue", `Discount (${currency})`)
          ) : (
            <Field label="Discount (%)" error={errors.discountValue?.message}>
              <input
                className={inputClass}
                type="number"
                min="0"
                max="100"
                step="0.01"
                disabled={values.discountType === "none"}
                {...register("discountValue", { valueAsNumber: true })}
              />
            </Field>
          )}
          <Field
            label="Tax (%)"
            hint="Applied after discounts, before the extra fees below."
            error={errors.taxRate?.message}
          >
            <input
              className={inputClass}
              type="number"
              min="0"
              max="100"
              step="0.01"
              {...register("taxRate", { valueAsNumber: true })}
            />
          </Field>
          {money("deliveryFee", `Delivery fee (${currency})`)}
          {money("installationFee", `Installation fee (${currency})`)}
          {money("otherCharges", `Other charges (${currency})`)}
        </Section>
        <Section title="Notes and terms">
          <Field label="Customer-facing notes" error={errors.notes?.message}>
            <textarea className={inputClass} rows={5} {...register("notes")} />
          </Field>
          <Field label="Terms" error={errors.terms?.message}>
            <textarea className={inputClass} rows={5} {...register("terms")} />
          </Field>
        </Section>
        <div className="rounded-xl bg-slate-900 p-6 text-white">
          <h2 className="text-lg font-semibold">Quotation total</h2>
          {totals ? (
            <dl className="mt-4 space-y-2">
              {[
                ["Subtotal (after line discounts)", totals.subtotal],
                ["Quotation discount", -totals.discountAmount],
                ["Tax", totals.taxAmount],
                [
                  "Extra fees",
                  (values.deliveryFee || 0) +
                    (values.installationFee || 0) +
                    (values.otherCharges || 0),
                ],
                ["Grand total", totals.total],
              ].map(([label, value]) => (
                <div className="flex justify-between gap-4" key={label}>
                  <dt>{label}</dt>
                  <dd className="font-bold">
                    {formatMoney(Number(value), currency)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-2">
              {calculationError || "Complete the line items to preview totals."}
            </p>
          )}
          <p className="mt-4 text-xs text-slate-300">
            Final totals are validated and recalculated when saved.
          </p>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </p>
        )}
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="text-red-700">
            Please check the highlighted fields before saving.
          </p>
        )}
        <div className="flex gap-4">
          <button className={buttonClass} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save draft quotation"}
          </button>
          <Link
            className={linkClass}
            href={
              quotation
                ? `/admin/sales/quotations/${quotation.id}`
                : "/admin/sales/quotations"
            }
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
