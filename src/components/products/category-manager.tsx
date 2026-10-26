"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  productCategorySchema,
  type ProductCategoryInput,
  type ProductCategoryValues,
} from "@/lib/validations/product";
import type { ProductCategoryDto } from "@/types/product";
import type { ProductType } from "@/lib/constants/products";

export function CategoryManager({
  categories,
  productType = "led-screen",
}: {
  categories: ProductCategoryDto[];
  productType?: ProductType;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<ProductCategoryDto | null>(null);
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductCategoryInput, unknown, ProductCategoryValues>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      active: true,
      sortOrder: 0,
      productType,
    },
  });
  function edit(category: ProductCategoryDto) {
    setMessage("");
    setEditing(category);
    reset(
      Object.fromEntries(
        Object.keys(productCategorySchema.shape).map((key) => [
          key,
          category[key as keyof ProductCategoryDto],
        ]),
      ) as ProductCategoryInput,
    );
  }
  async function submit(values: ProductCategoryValues) {
    setMessage("");
    try {
      const response = await fetch(
        editing
          ? `/api/product-categories/${editing.id}`
          : "/api/product-categories",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const body = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(body.message || "Could not save the category.");
      setMessage(body.message || "Category saved.");
      setEditing(null);
      reset({
        name: "",
        description: "",
        imageUrl: "",
        active: true,
        sortOrder: 0,
        productType,
      });
      router.refresh();
    } catch (error) {
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Could not save the category.",
      });
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form
        action="/api/product-categories"
        method="post"
        onSubmit={handleSubmit(submit)}
        noValidate
        className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <input
          type="hidden"
          defaultValue={productType}
          {...register("productType")}
        />
        {editing && (
          <input type="hidden" name="categoryId" value={editing.id} readOnly />
        )}
        <h2 className="text-lg font-bold">
          {editing ? "Edit category" : "New category"}
        </h2>
        {message && (
          <p role="status" className="text-success-700 text-sm">
            {message}
          </p>
        )}
        {errors.root && (
          <p role="alert" className="text-sm text-red-700">
            {errors.root.message}
          </p>
        )}
        <label className="block text-sm font-semibold">
          Name
          <input
            {...register("name")}
            className="mt-2 w-full rounded-lg border border-slate-300 p-2.5"
          />
        </label>
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
        <label className="block text-sm font-semibold">
          Description
          <textarea
            {...register("description")}
            rows={4}
            className="mt-2 w-full rounded-lg border border-slate-300 p-2.5"
          />
        </label>
        {errors.description && (
          <p role="alert" className="text-sm text-red-600">
            {errors.description.message}
          </p>
        )}
        <label className="block text-sm font-semibold">
          Image URL (optional)
          <input
            {...register("imageUrl")}
            type="text"
            placeholder="https://example.com/image.jpg or /images/accessory.jpg"
            className="mt-2 w-full rounded-lg border border-slate-300 p-2.5"
          />
        </label>
        {errors.imageUrl && (
          <p role="alert" className="text-sm text-red-600">
            {errors.imageUrl.message}
          </p>
        )}
        <label className="block text-sm font-semibold">
          Sort order
          <input
            {...register("sortOrder")}
            type="number"
            defaultValue={0}
            className="mt-2 w-full rounded-lg border border-slate-300 p-2.5"
          />
        </label>
        {errors.sortOrder && (
          <p role="alert" className="text-sm text-red-600">
            {errors.sortOrder.message}
          </p>
        )}
        <label className="flex gap-2 text-sm font-semibold">
          <input type="checkbox" defaultChecked {...register("active")} />{" "}
          Active
        </label>
        <div className="flex gap-2">
          <button
            disabled={isSubmitting}
            className="bg-primary rounded-lg px-4 py-2.5 font-bold"
          >
            {isSubmitting ? "Saving…" : "Save category"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                reset();
              }}
              className="rounded-lg border px-4 py-2.5"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Status</th>
              <th className="p-4">Order</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-t border-slate-100">
                <td className="p-4 font-semibold">{category.name}</td>
                <td className="p-4">
                  {category.active ? "Active" : "Inactive"}
                </td>
                <td className="p-4">{category.sortOrder}</td>
                <td className="p-4">
                  <button
                    type="button"
                    onClick={() => edit(category)}
                    className="text-brand-700 font-semibold"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <p className="p-8 text-center text-slate-500">No categories yet.</p>
        )}
      </div>
    </div>
  );
}
