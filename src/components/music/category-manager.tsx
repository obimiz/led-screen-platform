"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { salesFetch } from "@/components/sales/client-api";
type Category = {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};
const suggestions = [
  "Catholic Hymns",
  "Sacred Music",
  "Choir Performances",
  "Gospel Music",
  "Instrumental Music",
  "Worship & Praise",
  "Other Christian Music",
];
function CategoryEditor({ category }: { category: Category }) {
  const [name, setName] = useState(category.name),
    [active, setActive] = useState(category.isActive),
    [order, setOrder] = useState(category.sortOrder),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form
      className="space-y-3 rounded-xl border p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await salesFetch(`/api/music/categories/${category.id}`, "PUT", {
            name,
            isActive: active,
            sortOrder: order,
          });
          setMessage("Category saved");
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="block text-sm font-semibold">
        Category name
        <input
          className="mt-2 w-full rounded border p-3"
          required
          minLength={2}
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="flex gap-3">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Active for new selections
      </label>
      <label className="block text-sm">
        Display order
        <input
          type="number"
          min={0}
          step={1}
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          className="mt-2 w-full rounded border p-2"
        />
      </label>
      <button className="rounded border px-4 py-2" disabled={busy}>
        {busy ? "Saving…" : "Save category"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
export function MusicCategoryManager({
  categories,
}: {
  categories: Category[];
}) {
  const [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <>
      <p className="mt-3 text-slate-600">
        Create your own category or choose a suggested name. Deactivating a
        category preserves its existing music associations.
      </p>
      <form
        className="mt-6 max-w-xl space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await salesFetch("/api/music/categories", "POST", { name });
            setName("");
            setMessage("Category created");
            router.refresh();
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block font-semibold">
          New category name
          <input
            name="name"
            list="music-category-suggestions"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={120}
            className="mt-2 w-full rounded border p-3"
          />
        </label>
        <datalist id="music-category-suggestions">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <button
          disabled={busy}
          className="bg-primary rounded-lg px-4 py-3 font-bold text-white"
        >
          {busy ? "Creating…" : "Create category"}
        </button>
        {message && <p role="status">{message}</p>}
      </form>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {categories.map((c) => (
          <CategoryEditor key={c.id} category={c} />
        ))}
      </div>
    </>
  );
}
