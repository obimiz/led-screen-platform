"use client";

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
  videoUrl: "",
  price: null,
  currency: defaultCurrency,
  priceType: "quote",
  stockStatus: "made-to-order",
  quantity: 0,
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
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-slate-800">
        {label}
      </label>
      <input
        id={name}
        type={type}
        {...register(name)}
        aria-invalid={Boolean(error)}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
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
          className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-700"
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
                onChange(
                  values.map((item, itemIndex) =>
                    itemIndex === index ? event.target.value : item,
                  ),
                )
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-cyan-600"
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
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? { ...product, category: product.category.id }
      : defaults,
  });
  const specs = useFieldArray({ control, name: "specifications" });
  const features = useWatch({ control, name: "features" }) ?? [];
  const applications = useWatch({ control, name: "usageApplications" }) ?? [];
  const inputs = useWatch({ control, name: "supportedInputs" }) ?? [];
  const images = useWatch({ control, name: "imageUrls" }) ?? [];
  const featuredImage = useWatch({ control, name: "featuredImageUrl" }) ?? "";
  const priceType = useWatch({ control, name: "priceType" });

  async function submit(values: ProductValues) {
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
      };
      if (!response.ok || !body.data)
        return setError("root", { message: body.message });
      router.push(`/admin/products/${body.data.id}`);
      router.refresh();
    } catch {
      setError("root", {
        message: "Unable to save this product. Please try again.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
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
            {...register("category")}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
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
            <p className="mt-1 text-sm text-red-600">
              {errors.category.message}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="shortDescription" className="text-sm font-semibold">
            Short description
          </label>
          <textarea
            id="shortDescription"
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
          <label htmlFor="description" className="text-sm font-semibold">
            Full description
          </label>
          <textarea
            id="description"
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
          <label htmlFor="indoorOutdoor" className="text-sm font-semibold">
            Environment
          </label>
          <select
            id="indoorOutdoor"
            {...register("indoorOutdoor")}
            className="mt-2 w-full rounded-lg border border-slate-300 p-2.5"
          >
            {indoorOutdoorOptions.map((value) => (
              <option key={value}>{value}</option>
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
          <label htmlFor="maintenanceType" className="text-sm font-semibold">
            Maintenance type
          </label>
          <select
            id="maintenanceType"
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
        {(featuredImage || images.some(Boolean)) && (
          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            {[featuredImage, ...images].filter(Boolean).map((image, index) => (
              <ProductImage
                key={`${image}-${index}`}
                url={image}
                name={`Product image preview ${index + 1}`}
                className="aspect-square rounded-lg border border-slate-200"
              />
            ))}
          </div>
        )}
      </Section>
      <Section title="Additional specifications">
        <div className="space-y-2 sm:col-span-2">
          {specs.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
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
            className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-700"
          >
            <Plus size={15} /> Add specification
          </button>
        </div>
      </Section>
      <Section title="Media">
        <Input
          name="featuredImageUrl"
          label="Featured image URL"
          register={register}
          error={errors.featuredImageUrl}
          type="url"
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
          <label htmlFor="priceType" className="text-sm font-semibold">
            Price type
          </label>
          <select
            id="priceType"
            {...register("priceType")}
            className="mt-2 w-full rounded-lg border border-slate-300 p-2.5"
          >
            {priceTypes.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        {priceType === "fixed" && (
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
          <label htmlFor="stockStatus" className="text-sm font-semibold">
            Stock status
          </label>
          <select
            id="stockStatus"
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
      </Section>
      <Section title="Publishing and SEO">
        <div>
          <label htmlFor="status" className="text-sm font-semibold">
            Publication status
          </label>
          <select
            id="status"
            {...register("status")}
            className="mt-2 w-full rounded-lg border border-slate-300 p-2.5"
          >
            {productStatuses.map((value) => (
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
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
      >
        {isSubmitting ? (
          <LoaderCircle className="animate-spin" size={18} />
        ) : (
          <Save size={18} />
        )}
        {isSubmitting ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}
