"use client";
import { useState } from "react";
import { ContentMediaManager } from "@/components/publishing/media-manager";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useFieldArray,
  useForm,
  useWatch,
  type FieldError,
  type UseFormRegister,
} from "react-hook-form";
import {
  defaultCurrency,
  priceTypes,
  productStatuses,
  stockStatuses,
} from "@/lib/constants/products";
import {
  accessorySchema,
  type AccessoryFormInput,
  type AccessoryValues,
} from "@/lib/validations/product";
import type { AccessoryProduct, ProductCategoryDto } from "@/types/product";

type Name = keyof AccessoryFormInput;
const defaults: AccessoryFormInput = {
  productType: "led-accessory",
  name: "",
  category: "",
  brand: "",
  modelNumber: "",
  sku: "",
  shortDescription: "",
  description: "",
  features: [],
  compatibility: [],
  specifications: [],
  imageUrls: [],
  featuredImageUrl: "",
  videoUrl: "",
  price: null,
  currency: defaultCurrency,
  priceType: "contact",
  stockStatus: "in-stock",
  quantity: 0,
  isPurchasableOnline: false,
  minOrderQuantity: 1,
  maxOrderQuantity: null,
  allowBackorder: false,
  trackInventory: true,
  lowStockThreshold: 1,
  shippingRequired: true,
  orderNotes: "",
  featured: false,
  status: "draft",
  seoTitle: "",
  seoDescription: "",
};
function Input({
  name,
  label,
  register,
  error,
  type = "text",
}: {
  name: Name;
  label: string;
  register: UseFormRegister<AccessoryFormInput>;
  error?: FieldError;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={name}
        type={type}
        step={type === "number" ? "0.01" : undefined}
        {...register(name)}
        aria-invalid={Boolean(error)}
        className="focus:border-brand-600 mt-2 w-full rounded-lg border border-slate-300 p-2.5 outline-none"
      />
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {error.message}
        </p>
      )}
    </div>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <legend className="px-1 text-lg font-bold">{title}</legend>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
function List({
  label,
  values,
  change,
}: {
  label: string;
  values: string[];
  change: (values: string[]) => void;
}) {
  return (
    <div className="sm:col-span-2">
      <div className="mb-2 flex justify-between">
        <span className="text-sm font-semibold">{label}</span>
        <button
          type="button"
          onClick={() => change([...values, ""])}
          className="text-brand-700 inline-flex items-center gap-1 text-sm font-semibold"
        >
          <Plus size={15} /> Add
        </button>
      </div>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={value}
              onChange={(event) =>
                change(
                  values.map((item, current) =>
                    current === index ? event.target.value : item,
                  ),
                )
              }
              className="w-full rounded-lg border p-2.5"
            />
            <button
              type="button"
              aria-label={`Remove ${label} item`}
              onClick={() =>
                change(values.filter((_, current) => current !== index))
              }
              className="grid size-11 place-items-center text-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AccessoryForm({
  categories,
  accessory,
}: {
  categories: ProductCategoryDto[];
  accessory?: AccessoryProduct;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const {
    register,
    control,
    setValue,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccessoryFormInput, unknown, AccessoryValues>({
    resolver: zodResolver(accessorySchema),
    defaultValues: accessory
      ? (Object.fromEntries(
          Object.keys(accessorySchema.shape).map((key) => [
            key,
            key === "category"
              ? accessory.category.id
              : accessory[key as keyof AccessoryProduct],
          ]),
        ) as AccessoryFormInput)
      : defaults,
  });
  const specs = useFieldArray({ control, name: "specifications" });
  const features = useWatch({ control, name: "features" }) ?? [];
  const compatibility = useWatch({ control, name: "compatibility" }) ?? [];
  const images = useWatch({ control, name: "imageUrls" }) ?? [];
  const featuredImage = useWatch({ control, name: "featuredImageUrl" }) ?? "";
  const useWatchAlt = useWatch({ control, name: "imageAlt" }) ?? "";
  const useWatchAlts = useWatch({ control, name: "imageAlts" }) ?? [];
  const priceType = useWatch({ control, name: "priceType" });
  async function submit(values: AccessoryValues) {
    try {
      const response = await fetch(
        accessory ? `/api/products/${accessory.id}` : "/api/products",
        {
          method: accessory ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const body = (await response.json()) as {
        message: string;
        data?: AccessoryProduct;
      };
      if (!response.ok || !body.data)
        return setError("root", { message: body.message });
      router.push(`/admin/accessories/${body.data.id}`);
      router.refresh();
    } catch {
      setError("root", { message: "Unable to save this accessory." });
    }
  }
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      <input type="hidden" {...register("productType")} />
      {errors.root && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {errors.root.message}
        </p>
      )}
      <Section title="Basic information">
        <Input
          name="name"
          label="Product name"
          register={register}
          error={errors.name}
        />
        <div>
          <label htmlFor="category" className="text-sm font-semibold">
            Category
          </label>
          <select
            id="category"
            {...register("category", {
              onChange: (event) => {
                const category = categories.find(
                  (item) => item.id === event.target.value,
                );
                if (category?.slug === "led-screen-cameras")
                  setValue("showcase", "camera", { shouldDirty: true });
              },
            })}
            className="mt-2 w-full rounded-lg border p-2.5"
          >
            <option value="">Select category</option>
            {categories
              .filter((item) => item.active)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          {errors.category && (
            <p className="text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>
        <Input
          name="brand"
          label="Brand"
          register={register}
          error={errors.brand}
        />
        <Input
          name="modelNumber"
          label="Model number"
          register={register}
          error={errors.modelNumber}
        />
        <Input
          name="sku"
          label="SKU (optional)"
          register={register}
          error={errors.sku}
        />
        <div className="sm:col-span-2">
          <label htmlFor="shortDescription" className="text-sm font-semibold">
            Short description
          </label>
          <textarea
            id="shortDescription"
            rows={3}
            {...register("shortDescription")}
            className="mt-2 w-full rounded-lg border p-3"
          />
          {errors.shortDescription && (
            <p className="text-sm text-red-600">
              {errors.shortDescription.message}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className="text-sm font-semibold">
            Description
          </label>
          <textarea
            id="description"
            rows={7}
            {...register("description")}
            className="mt-2 w-full rounded-lg border p-3"
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
      </Section>
      <Section title="Features and compatibility">
        <List
          label="Features"
          values={features}
          change={(value) => setValue("features", value, { shouldDirty: true })}
        />
        <List
          label="Compatibility"
          values={compatibility}
          change={(value) =>
            setValue("compatibility", value, { shouldDirty: true })
          }
        />
      </Section>
      <Section title="Specifications">
        <div className="space-y-2 sm:col-span-2">
          {specs.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input
                aria-label="Specification label"
                {...register(`specifications.${index}.label`)}
                placeholder="Label"
                className="rounded-lg border p-2.5"
              />
              <input
                aria-label="Specification value"
                {...register(`specifications.${index}.value`)}
                placeholder="Value"
                className="rounded-lg border p-2.5"
              />
              <button
                type="button"
                onClick={() => specs.remove(index)}
                aria-label="Remove specification"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => specs.append({ label: "", value: "" })}
            className="text-brand-700 inline-flex items-center gap-1 text-sm font-semibold"
          >
            <Plus size={15} /> Add specification
          </button>
        </div>
      </Section>
      <ContentMediaManager
        maxImages={20}
        autoFeature
        value={{
          coverImageUrl: featuredImage,
          coverAlt: useWatchAlt,
          imageUrls: images,
          imageAlts: useWatchAlts.map((v) => v || ""),
        }}
        onBusyChange={setUploading}
        onChange={(m) => {
          setValue("featuredImageUrl", m.coverImageUrl, {
            shouldDirty: true,
            shouldValidate: true,
          });
          setValue("imageAlt", m.coverAlt, { shouldDirty: true });
          setValue("imageUrls", m.imageUrls, {
            shouldDirty: true,
            shouldValidate: true,
          });
          setValue("imageAlts", m.imageAlts, { shouldDirty: true });
        }}
      />
      <Section title="Pricing and stock">
        <Input
          name="promotionalPrice"
          label="Promotional price (NGN, optional)"
          type="number"
          register={register}
          error={errors.promotionalPrice as FieldError}
        />

        <div>
          <label htmlFor="priceType" className="text-sm font-semibold">
            Price type
          </label>
          <select
            id="priceType"
            {...register("priceType")}
            className="mt-2 w-full rounded-lg border p-2.5"
          >
            {priceTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        {["fixed", "from", "per_sqm"].includes(priceType) && (
          <Input
            name="price"
            label="Regular price (NGN)"
            type="number"
            register={register}
            error={errors.price as FieldError}
          />
        )}
        <Input
          name="currency"
          label="Currency"
          register={register}
          error={errors.currency}
        />
        <Input
          name="quantity"
          label="Quantity available"
          type="number"
          register={register}
          error={errors.quantity as FieldError}
        />
        <div>
          <label htmlFor="stockStatus" className="text-sm font-semibold">
            Stock status
          </label>
          <select
            id="stockStatus"
            {...register("stockStatus")}
            className="mt-2 w-full rounded-lg border p-2.5"
          >
            {stockStatuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </Section>
      <Section title="Publishing and SEO">
        <Input
          name="slug"
          label="Product slug (leave blank to generate)"
          register={register}
          error={errors.slug}
        />
        <label>
          Homepage classification
          <select
            {...register("showcase")}
            className="mt-2 w-full rounded-lg border p-3"
          >
            <option value="accessory">LED accessory</option>
            <option value="video">Video accessory</option>
            <option value="camera">Camera / live video</option>
          </select>
        </label>

        <div>
          <label htmlFor="status" className="text-sm font-semibold">
            Status
          </label>
          <select
            id="status"
            {...register("status")}
            className="mt-2 w-full rounded-lg border p-2.5"
          >
            {productStatuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pt-8 text-sm font-semibold">
          <input type="checkbox" {...register("featured")} /> Featured accessory
        </label>
        <Input
          name="seoTitle"
          label="SEO title"
          register={register}
          error={errors.seoTitle}
        />
        <Input
          name="seoDescription"
          label="SEO description"
          register={register}
          error={errors.seoDescription}
        />
      </Section>
      <button
        disabled={isSubmitting || uploading}
        className="bg-primary inline-flex items-center gap-2 rounded-lg px-5 py-3 font-bold text-white disabled:opacity-50"
      >
        {isSubmitting ? (
          <LoaderCircle size={18} className="animate-spin" />
        ) : (
          <Save size={18} />
        )}
        {isSubmitting ? "Saving…" : "Save accessory"}
      </button>
    </form>
  );
}
