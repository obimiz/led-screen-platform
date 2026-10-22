"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { salesFetch } from "@/components/sales/client-api";
type Category = {
  id: string;
  name: string;
  scope?: string;
  isActive: boolean;
  sortOrder?: number;
  description?: string;
};
function CategoryForm({ category }: { category?: Category }) {
  const [name, setName] = useState(category?.name || ""),
    [scope, setScope] = useState(category?.scope || "all"),
    [active, setActive] = useState(category?.isActive ?? true),
    [order, setOrder] = useState(category?.sortOrder || 0),
    [description, setDescription] = useState(category?.description || ""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form
      className="min-w-0 space-y-3 rounded-xl border bg-white p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await salesFetch(
            category
              ? `/api/portfolio/categories/${category.id}`
              : "/api/portfolio/categories",
            category ? "PUT" : "POST",
            { name, scope, isActive: active, sortOrder: order, description },
          );
          setMessage(category ? "Category saved" : "Category created");
          if (!category) setName("");
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="block text-sm font-bold">
        {category ? "Category name" : "New category name"}
        <input
          className="mt-1 w-full rounded border p-3"
          required
          minLength={2}
          maxLength={120}
          list={!category ? "publishing-category-suggestions" : undefined}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Category type
        <select
          className="mt-1 w-full rounded border p-3"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        >
          <option value="all">Projects and articles</option>
          <option value="project">Projects</option>
          <option value="article">Blog articles</option>
        </select>
      </label>
      <label className="block text-sm">
        Description
        <textarea
          className="mt-1 w-full rounded border p-3"
          maxLength={1000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Display order
        <input
          type="number"
          min={0}
          max={100000}
          className="mt-1 w-full rounded border p-3"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
        />
      </label>
      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Active
      </label>
      <button
        disabled={busy}
        className="bg-primary rounded-lg px-4 py-2 font-bold text-white"
      >
        {busy ? "Saving…" : category ? "Save category" : "Create category"}
      </button>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </form>
  );
}
export function PublishingCategories({
  categories,
}: {
  categories: Category[];
}) {
  return (
    <div className="space-y-6">
      <p className="text-slate-600">
        Create categories for projects, articles or both. Deactivation keeps
        existing post associations. A category type cannot change while posts
        use it.
      </p>
      <datalist id="publishing-category-suggestions">
        {[
          "LED Screen Installation",
          "LED Screen Rental",
          "LED Screen Sales",
          "LED Screen Maintenance",
          "Electronic Bell & Alarm Installation",
          "Audio System Installation",
          "Other Completed Projects",
          "Company News",
          "LED Technology",
          "Product Updates",
          "Installation Guides",
          "Maintenance Tips",
          "Events & Exhibitions",
          "Industry Insights",
        ].map((v) => (
          <option value={v} key={v} />
        ))}
      </datalist>
      <CategoryForm />
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((c) => (
          <CategoryForm key={c.id} category={c} />
        ))}
      </div>
    </div>
  );
}
