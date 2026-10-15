"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useFieldArray,
  useForm,
  useWatch,
  type FieldError,
  type UseFormRegister,
} from "react-hook-form";

import { ProductImagePicker } from "@/components/products/product-image-picker";
import { ProductImage } from "@/components/products/product-media";
import {
  defaultCurrency,
  indoorOutdoorOptions,
  maintenanceTypes,
  priceTypes,
  productStatuses,
  stockStatuses,
} from "@/lib/constants/products";
import {
  productSchema,
  type ProductFormInput,
  type ProductValues,
} from "@/lib/validations/product";
import type { LedProduct, ProductCategoryDto } from "@/types/product";

type Name = keyof ProductFormInput;
const defaults: ProductFormInput = {
  name: "",
  category: "",
  shortDescription: "",
  description: "",
  indoorOutdoor: "indoor",
  pixelPitch: "",
  displayTechnology: "SMD LED",
  brightness: "",
  refreshRate: "",
  viewingAngle: "",
  cabinetSize: "",
  moduleSize: "",
  resolution: "",
  weight: "",
  powerConsumption: "",
  voltage: "",
  waterproofRating: "",
  lifespan: "",
  maintenanceType: "not-specified",
  minimumViewingDistance: "",
  maximumViewingDistance: "",
  supportedInputs: [],
  usageApplications: [],
  specifications: [],
  features: [],
  imageUrls: [],
  featuredImageUrl: "",
  imageFit: "cover",
  videoUrl: "",
  price: null,
  currency: defaultCurrency,
  priceType: "quote",
  stockStatus: "made-to-order",
  quantity: 0,
  isPurchasableOnline: false,
  minOrderQuantity: 1,
  maxOrderQuantity: null,
  allowBackorder: false,
  trackInventory: true,
  lowStockThreshold: 1,
  shippingRequired: true,
  orderNotes: "",
  isRentable: false,
  rentalQuantityAvailable: 0,
  rentalDailyRate: null,
  rentalHourlyRate: null,
  minimumRentalDays: 1,
  rentalDepositAmount: 0,
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
  register: UseFormRegister<ProductFormInput>;
  error?: FieldError;
  type?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-slate-800">
        {label}
      </label>
      <input
        id={id}
        type={type}
        {...register(name)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="focus:border-brand-600 focus:ring-brand-100 mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:ring-2"
      />
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1 text-sm text-red-600"
        >
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
function StringList({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="sm:col-span-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...values, ""])}
          className="text-brand-700 inline-flex items-center gap-1 text-sm font-semibold"
        >
          <Plus size={15} /> Add
        </button>
      </div>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              aria-label={`${label} item ${index + 1}`}
              value={value}
              onChange={(event) =>
                onChange(
                  values.map((item, itemIndex) =>
                    itemIndex === index ? event.target.value : item,
                  ),
                )
              }
              className="focus:border-brand-600 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none"
            />
            <button
              type="button"
              aria-label={`Remove ${label} item ${index + 1}`}
              onClick={() =>
                onChange(values.filter((_, itemIndex) => itemIndex !== index))
              }
              className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductForm({
  categories,
  product,
}: {
  categories: ProductCategoryDto[];
  product?: LedProduct;
}) {
  const router = useRouter();
  const formId = useId();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductFormInput, unknown, ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? (Object.fromEntries(
          Object.keys(defaults).map((name) => [
            name,
            name === "category"
              ? product.category.id
              : (product[name as keyof LedProduct] ?? defaults[name as Name]),
          ]),
        ) as ProductFormInput)
      : defaults,
  });
  const saved = useRef(false);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);
  const [uploading, setUploading] = useState(false);
  const editing = Boolean(product);
  useLayoutEffect(
    () => () => {
      // Next.js may retain hidden routes for back/forward navigation.
      if (saved.current) {
        saved.current = false;
        setSavedSuccessfully(false);
      }
    },
    [],
  );
  useEffect(() => {
    if (!isDirty && !uploading) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (!saved.current) event.preventDefault();
    };
    const guard = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a[href]");
      if (saved.current || !link) return;
      if (!window.confirm("Discard unsaved product changes?")) {
        event.preventDefault();
        event.stopPropagation();
      } else reset();
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guard, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", guard, true);
    };
  }, [isDirty, uploading, reset]);
  const specs = useFieldArray({ control, name: "specifications" });
  const features = useWatch({ control, name: "features" }) ?? [];
  const applications = useWatch({ control, name: "usageApplications" }) ?? [];
  const inputs = useWatch({ control, name: "supportedInputs" }) ?? [];
  const images = useWatch({ control, name: "imageUrls" }) ?? [];
  const imageFit = useWatch({ control, name: "imageFit" }) ?? "cover";
  const featuredImage = useWatch({ control, name: "featuredImageUrl" }) ?? "";
  const priceType = useWatch({ control, name: "priceType" });

  async function submit(values: ProductValues) {
    if (saved.current || uploading) return;
    const endpoint = product ? `/api/products/${product.id}` : "/api/products";
    try {
      const response = await fetch(endpoint, {
        method: product ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await response.json()) as {
        success: boolean;
        message: string;
        data?: LedProduct;
        errors?: Record<string, string[]>;
      };
      if (!response.ok || !body.data) {
        for (const [field, messages] of Object.entries(body.errors ?? {}))
          setError(field as Name, { message: messages[0] });
        return setError("root", { message: body.message });
      }
      saved.current = true;
      setSavedSuccessfully(true);
      reset(editing ? values : defaults);
      router.push(`/admin/products/${body.data.id}?saved=1`);
      router.refresh();
    } catch {
      setError("root", {
        message: "Unable to save this product. Please try again.",
      });
    }
  }

  return (
    <form
      onSubmit={(event) => {
        const button = (event.nativeEvent as SubmitEvent)
          .submitter as HTMLButtonElement | null;
        if (button?.value === "draft")
          setValue("status", "draft", { shouldDirty: true });
        void handleSubmit(submit, () =>
          setError("root", {
            message: "Please correct the highlighted fields before saving.",
          }),
        )(event);
      }}
      noValidate
      className="space-y-6"
    >
      {isDirty && (
        <p role="status" className="text-sm text-amber-700">
          You have unsaved changes.
        </p>
      )}
      {errors.root && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {errors.root.message}
        </p>
      )}
      <Section title="Basic information">
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input type="checkbox" {...register("isPurchasableOnline")} />{" "}
          Available for online purchase (fixed-price products only)
        </label>
        <Input
          name="name"
          label="Product name"
          register={register}
          error={errors.name}
        />
        <div>
          <label
            htmlFor={`${formId}-category`}
            className="text-sm font-semibold"
          >
            Category
          </label>
          <select
            id={`${formId}-category`}
            {...register("category")}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
          >
            <option value="">Select category</option>
            {categories
              .filter((item) => item.active || item.id === product?.category.id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">
              {errors.category.message}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor={`${formId}-shortDescription`}
            className="text-sm font-semibold"
          >
            Short description
          </label>
          <textarea
            id={`${formId}-shortDescription`}
            rows={3}
            {...register("shortDescription")}
            className="mt-2 w-full rounded-lg border border-slate-300 p-3"
          />
          {errors.shortDescription && (
            <p className="text-sm text-red-600">
              {errors.shortDescription.message}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor={`${formId}-description`}
            className="text-sm font-semibold"
          >
            Full description
          </label>
          <textarea
            id={`${formId}-description`}
            rows={7}
            {...register("description")}
            className="mt-2 w-full rounded-lg border border-slate-300 p-3"
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
      </Section>
      <Section title="Display information">
        <div>
          <label
            htmlFor={`${formId}-indoorOutdoor`}
            className="text-sm font-semibold"
          >
            Environment
          </label>
          <select
            id={`${formId}-indoorOutdoor`}
            {...register("indoorOutdoor")}
            className="mt-2 w-full rounded-lg border border-slate-300 p-2.5"
          >
            {indoorOutdoorOptions.map((value) => (
              <option key={value} value={value}>
                {value === "not-specified" ? "To be confirmed" : value}
              </option>
            ))}
          </select>
        </div>
        {(
          [
            "pixelPitch",
            "displayTechnology",
            "brightness",
            "refreshRate",
            "viewingAngle",
          ] as const
        ).map((name) => (
          <Input
            key={name}
            name={name}
            label={name.replace(/([A-Z])/g, " $1")}
            register={register}
            error={errors[name]}
          />
        ))}
      </Section>
      <Section title="Physical specifications">
        {(["cabinetSize", "moduleSize", "resolution", "weight"] as const).map(
          (name) => (
            <Input
              key={name}
              name={name}
              label={name.replace(/([A-Z])/g, " $1")}
              register={register}
              error={errors[name]}
            />
          ),
        )}
      </Section>
      <Section title="Electrical and performance">
        {(
          [
            "powerConsumption",
            "voltage",
            "waterproofRating",
            "lifespan",
          ] as const
        ).map((name) => (
          <Input
            key={name}
            name={name}
            label={name.replace(/([A-Z])/g, " $1")}
            register={register}
            error={errors[name]}
          />
        ))}
      </Section>
      <Section title="Installation and maintenance">
        <div>
          <label
            htmlFor={`${formId}-maintenanceType`}
            className="text-sm font-semibold"
          >
            Maintenance type
          </label>
          <select
            id={`${formId}-maintenanceType`}
            {...register("maintenanceType")}
            className="mt-2 w-full rounded-lg border border-slate-300 p-2.5"
          >
            {maintenanceTypes.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <Input
          name="minimumViewingDistance"
          label="Minimum viewing distance"
          register={register}
        />
        <Input
          name="maximumViewingDistance"
          label="Maximum viewing distance"
          register={register}
        />
      </Section>
      <Section title="Features and applications">
        <StringList
          label="Features"
          values={features}
          onChange={(value) =>
            setValue("features", value, { shouldDirty: true })
          }
        />
        <StringList
          label="Applications"
          values={applications}
          onChange={(value) =>
            setValue("usageApplications", value, { shouldDirty: true })
          }
        />
        <StringList
          label="Supported inputs"
          values={inputs}
          onChange={(value) =>
            setValue("supportedInputs", value, { shouldDirty: true })
          }
        />
      </Section>
      <Section title="Additional specifications">
        <div className="space-y-2 sm:col-span-2">
          {specs.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]"
            >
              <input
                aria-label={`Specification ${index + 1} label`}
                {...register(`specifications.${index}.label`)}
                placeholder="Label"
                className="rounded-lg border border-slate-300 p-2"
              />
              <input
                aria-label={`Specification ${index + 1} value`}
                {...register(`specifications.${index}.value`)}
                placeholder="Value"
                className="rounded-lg border border-slate-300 p-2"
              />
              <button
                type="button"
                onClick={() => specs.remove(index)}
                aria-label="Remove specification"
              >
                <Trash2 size={17} />
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
      <Section title="Media">
        {(featuredImage || images.some(Boolean)) && (
          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            {[featuredImage, ...images].filter(Boolean).map((image, index) => (
              <ProductImage
                key={`${image}-${index}`}
                url={image}
                name={`Product image preview ${index + 1}`}
                fit={imageFit}
                neutralFallback
                className="aspect-square rounded-lg border border-slate-200"
              />
            ))}
          </div>
        )}
        <ProductImagePicker
          hasFeaturedImage={Boolean(featuredImage)}
          galleryFull={images.filter(Boolean).length >= 20}
          onBusyChange={setUploading}
          onSelect={(url, featured) => {
            if (featured)
              setValue("featuredImageUrl", url, {
                shouldDirty: true,
                shouldValidate: true,
              });
            else if (!images.includes(url) && images.length < 20)
              setValue("imageUrls", [...images.filter(Boolean), url], {
                shouldDirty: true,
                shouldValidate: true,
              });
          }}
        />
        <button
          type="button"
          onClick={() =>
            setValue("featuredImageUrl", "", { shouldDirty: true })
          }
          className="text-sm font-semibold text-red-600"
        >
          Remove featured image
        </button>
        <div>
          <label
            htmlFor={`${formId}-imageFit`}
            className="text-sm font-semibold"
          >
            Image presentation
          </label>
          <select
            id={`${formId}-imageFit`}
            {...register("imageFit")}
            className="mt-2 w-full rounded-lg border border-slate-300 p-3"
          >
            <option value="cover">
              Installation / environment photo (fill frame)
            </option>
            <option value="contain">
              Isolated product photo (show entire product)
            </option>
          </select>
        </div>
        <p className="text-sm text-slate-500">
          Select a local image, upload an image, or enter an existing image URL.
          Removing an image here removes its product association when you save.
        </p>
        <Input
          name="featuredImageUrl"
          label="Featured image URL"
          register={register}
          error={errors.featuredImageUrl}
          type="text"
        />
        <Input
          name="videoUrl"
          label="Video URL"
          register={register}
          error={errors.videoUrl}
          type="url"
        />
        <StringList
          label="Additional image URLs"
          values={images}
          onChange={(value) =>
            setValue("imageUrls", value, { shouldDirty: true })
          }
        />
      </Section>
      <Section title="Pricing and availability">
        <div>
          <label
            htmlFor={`${formId}-priceType`}
            className="text-sm font-semibold"
          >
            Price type
          </label>
          <select
            id={`${formId}-priceType`}
            {...register("priceType")}
            className="mt-2 w-full rounded-lg border border-slate-300 p-2.5"
          >
            {priceTypes.map((value) => (
              <option key={value} value={value}>
                {value === "contact"
                  ? "Price on Request"
                  : value === "quote"
                    ? "Request Quote"
                    : value}
              </option>
            ))}
          </select>
        </div>
        {["fixed", "from", "per_sqm"].includes(priceType) && (
          <Input
            name="price"
            label="Price"
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
        <div>
          <label
            htmlFor={`${formId}-stockStatus`}
            className="text-sm font-semibold"
          >
            Stock status
          </label>
          <select
            id={`${formId}-stockStatus`}
            {...register("stockStatus")}
            className="mt-2 w-full rounded-lg border border-slate-300 p-2.5"
          >
            {stockStatuses.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <Input
          name="quantity"
          label="Quantity"
          type="number"
          register={register}
          error={errors.quantity as FieldError}
        />
        <label className="flex items-center gap-2 pt-8 text-sm font-semibold">
          <input type="checkbox" {...register("isRentable")} /> Available for
          rental
        </label>
        <Input
          name="rentalQuantityAvailable"
          label="Rental quantity available"
          type="number"
          register={register}
          error={errors.rentalQuantityAvailable as FieldError}
        />
        <Input
          name="rentalDailyRate"
          label="Rental daily rate"
          type="number"
          register={register}
          error={errors.rentalDailyRate as FieldError}
        />
        <Input
          name="rentalHourlyRate"
          label="Rental hourly rate"
          type="number"
          register={register}
          error={errors.rentalHourlyRate as FieldError}
        />
        <Input
          name="minimumRentalDays"
          label="Minimum rental days"
          type="number"
          register={register}
          error={errors.minimumRentalDays as FieldError}
        />
        <Input
          name="rentalDepositAmount"
          label="Default rental deposit"
          type="number"
          register={register}
          error={errors.rentalDepositAmount as FieldError}
        />
      </Section>
      {Object.entries(errors).filter(([name]) => name !== "root").length >
        0 && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {Object.entries(errors)
            .filter(([name]) => name !== "root")
            .map(([name, error]) => (
              <p key={name}>
                {name.replace(/([A-Z])/g, " $1")}:{" "}
                {error &&
                "message" in error &&
                typeof error.message === "string"
                  ? error.message
                  : "Check each item for a valid value."}
              </p>
            ))}
        </div>
      )}
      <Section title="Publishing and SEO">
        <div>
          <label htmlFor={`${formId}-status`} className="text-sm font-semibold">
            Publication status
          </label>
          <select
            id={`${formId}-status`}
            {...register("status")}
            className="mt-2 w-full rounded-lg border border-slate-300 p-2.5"
          >
            {productStatuses
              .filter(
                (value) =>
                  value !== "archived" || product?.status === "archived",
              )
              .map((value) => (
                <option key={value}>{value}</option>
              ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pt-8 text-sm font-semibold">
          <input type="checkbox" {...register("featured")} /> Featured product
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
        type="submit"
        disabled={isSubmitting || uploading || savedSuccessfully}
        className="bg-primary inline-flex items-center gap-2 rounded-lg px-5 py-3 font-bold text-white disabled:opacity-50"
      >
        {isSubmitting ? (
          <LoaderCircle className="animate-spin" size={18} />
        ) : (
          <Save size={18} />
        )}
        {isSubmitting ? "Saving…" : "Save Product"}
      </button>
      <button
        type="submit"
        name="action"
        value="draft"
        disabled={isSubmitting || uploading || savedSuccessfully}
        className="ml-3 rounded-lg border border-slate-300 px-5 py-3 font-bold disabled:opacity-50"
      >
        Save as Draft
      </button>
    </form>
  );
}
