"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { bellAlarmSchema } from "@/lib/validations/product";
import { ContentMediaManager } from "@/components/publishing/media-manager";
import type { ProductCategoryDto } from "@/types/product";
type Values = ReturnType<typeof bellAlarmSchema.parse>;
export function BellAlarmProductForm({
  id,
  category,
  categories = [],
  initial,
}: {
  id?: string;
  category: string;
  categories?: ProductCategoryDto[];
  initial?: Partial<Values>;
}) {
  const router = useRouter();
  const cleanInitial = initial
    ? Object.fromEntries(
        Object.keys(bellAlarmSchema.shape)
          .filter((key) => key in initial)
          .map((key) => [key, initial[key as keyof Values]]),
      )
    : {};
  const [v, setV] = useState<Partial<Values>>({
      ...cleanInitial,
      productType: initial?.productType || "bell-alarm-system",
      category: initial?.category || category,
      priceType: initial?.priceType || "quote",
      stockStatus: initial?.stockStatus || "made-to-order",
      currency: "NGN",
      status: initial?.status || "draft",
    }),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false);
  function set(key: keyof Values, value: unknown) {
    setV((old) => ({ ...old, [key]: value }));
  }
  const activeCategories = categories.filter(
    (item) => item.active && item.productType === v.productType,
  );
  return (
    <form
      className="max-w-5xl space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!activeCategories.some((item) => item.id === v.category)) {
          setMessage(
            "Choose an active Bell & Alarm category. Create a category first if the list is empty.",
          );
          return;
        }
        const parsed = bellAlarmSchema.safeParse(v);
        if (!parsed.success) {
          setMessage(
            parsed.error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join("; "),
          );
          return;
        }
        setBusy(true);
        try {
          const r = await fetch(id ? `/api/products/${id}` : "/api/products", {
            method: id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed.data),
          });
          const b = await r.json();
          if (!r.ok) throw Error(b.message);
          router.push("/admin/bell-alarm/products");
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {(
          [
            "name",
            "slug",
            "shortDescription",
            "description",
            "seoTitle",
            "seoDescription",
          ] as const
        ).map((key) => (
          <label key={key} className="font-semibold">
            {
              {
                name: "Product name",
                slug: "Product slug (leave blank to generate)",
                shortDescription: "Short description",
                description: "Detailed description",
                seoTitle: "SEO title",
                seoDescription: "SEO description",
              }[key]
            }
            <textarea
              className="mt-2 w-full rounded border p-3"
              rows={key === "description" ? 6 : 2}
              value={v[key] || ""}
              onChange={(e) => set(key, e.target.value)}
            />
          </label>
        ))}
        <div>
          <label htmlFor="bell-category">Category</label>
          <select
            id="bell-category"
            required
            disabled={activeCategories.length === 0}
            className="mt-2 w-full rounded border p-3"
            value={v.category || ""}
            onChange={(e) => set("category", e.target.value)}
          >
            <option value="">Choose category</option>
            {activeCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {activeCategories.length === 0 && (
            <span className="mt-2 block text-sm text-slate-600">
              No active categories are available for this product type. Create
              or activate a category before saving.
            </span>
          )}
          <Link
            className="text-brand-700 mt-2 block text-sm font-semibold underline"
            href={`/admin/product-categories?productType=${v.productType}`}
          >
            {activeCategories.length === 0
              ? "Create Category"
              : "Manage categories"}
          </Link>
        </div>
        {(["priceType", "stockStatus", "status"] as const).map((key) => (
          <label key={key}>
            {key}
            <select
              className="mt-2 w-full rounded border p-3"
              value={v[key]}
              onChange={(e) => set(key, e.target.value)}
            >
              {(key === "priceType"
                ? ["quote", "fixed", "contact"]
                : key === "status"
                  ? ["draft", "published", "archived"]
                  : [
                      "in-stock",
                      "low-stock",
                      "out-of-stock",
                      "made-to-order",
                      "unavailable",
                    ]
              ).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        ))}
        {(["price", "promotionalPrice"] as const).map((key) => (
          <label key={key}>
            {key === "price"
              ? "Regular price (NGN)"
              : "Promotional price (NGN)"}
            <input
              type="number"
              min="0"
              step="0.01"
              value={v[key] ?? ""}
              className="mt-2 w-full rounded border p-3"
              onChange={(e) =>
                set(key, e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </label>
        ))}
        <label>
          <input
            type="checkbox"
            checked={v.featured || false}
            onChange={(e) => set("featured", e.target.checked)}
          />{" "}
          Featured on homepage
        </label>
      </div>
      <fieldset className="space-y-3 rounded border p-4">
        <legend>Technical specifications</legend>
        {(v.specifications || []).map((spec, i) => (
          <div key={i} className="flex gap-2">
            <input
              aria-label="Specification label"
              className="min-w-0 rounded border p-2"
              value={spec.label}
              onChange={(e) =>
                set(
                  "specifications",
                  v.specifications?.map((s, j) =>
                    i === j ? { ...s, label: e.target.value } : s,
                  ),
                )
              }
            />
            <input
              aria-label="Specification value"
              className="min-w-0 rounded border p-2"
              value={spec.value}
              onChange={(e) =>
                set(
                  "specifications",
                  v.specifications?.map((s, j) =>
                    i === j ? { ...s, value: e.target.value } : s,
                  ),
                )
              }
            />
            <button
              type="button"
              onClick={() =>
                set(
                  "specifications",
                  v.specifications?.filter((_, j) => i !== j),
                )
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            set("specifications", [
              ...(v.specifications || []),
              { label: "", value: "" },
            ])
          }
        >
          Add specification
        </button>
      </fieldset>
      <ContentMediaManager
        autoFeature
        maxImages={20}
        value={{
          coverImageUrl: v.featuredImageUrl || "",
          coverAlt: v.imageAlt || "",
          imageUrls: v.imageUrls || [],
          imageAlts: v.imageAlts || [],
        }}
        onBusyChange={setUploading}
        onChange={(m) =>
          setV((old) => ({
            ...old,
            featuredImageUrl:
              m.coverImageUrl ||
              (!old.featuredImageUrl ? m.imageUrls[0] || "" : ""),
            imageAlt: m.coverAlt,
            imageUrls: m.imageUrls,
            imageAlts: m.imageAlts,
          }))
        }
      />
      <p role="alert">{message}</p>
      <button
        disabled={busy || uploading || activeCategories.length === 0}
        className="rounded bg-[#DD2421] px-5 py-3 font-bold text-white disabled:opacity-50"
      >
        Save product
      </button>
    </form>
  );
}
