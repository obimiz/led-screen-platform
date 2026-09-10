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
        {...register(name)}
        aria-invalid={Boolean(error)}
        className="mt-2 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-cyan-600"
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
      ? { ...accessory, category: accessory.category.id }
      : defaults,
  });
  const specs = useFieldArray({ control, name: "specifications" });
  const features = useWatch({ control, name: "features" }) ?? [];
  const compatibility = useWatch({ control, name: "compatibility" }) ?? [];
  const images = useWatch({ control, name: "imageUrls" }) ?? [];
  const featuredImage = useWatch({ control, name: "featuredImageUrl" }) ?? "";
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
            {...register("category")}
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
          type="url"
          register={register}
          error={errors.featuredImageUrl}
        />
        <Input
          name="videoUrl"
          label="Video URL"
          type="url"
          register={register}
          error={errors.videoUrl}
        />
        <List
          label="Additional image URLs"
          values={images}
          change={(value) =>
            setValue("imageUrls", value, { shouldDirty: true })
          }
        />
        {(featuredImage || images.some(Boolean)) && (
          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            {[featuredImage, ...images].filter(Boolean).map((image, index) => (
              <ProductImage
                key={`${image}-${index}`}
                url={image}
                name={`Accessory image preview ${index + 1}`}
                className="aspect-square rounded-lg"
              />
            ))}
          </div>
        )}
      </Section>
      <Section title="Pricing and stock">
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
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 font-bold disabled:opacity-50"
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
