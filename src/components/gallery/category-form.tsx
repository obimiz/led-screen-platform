"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { salesFetch } from "@/components/sales/client-api";
const suggestions = [
  "LED Screen Products",
  "LED Screen Installations",
  "LED Screen Rentals",
  "Events & Projects",
  "Electronic Bell & Alarm Systems",
  "Accessories & Components",
  "Other Projects",
];
export function GalleryCategoryForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      className="mt-8 max-w-xl space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          await salesFetch("/api/gallery/categories", "POST", { name });
          setName("");
          setMessage("Category added");
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
          list="gallery-category-suggestions"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={120}
          placeholder="Choose a suggestion or enter a name"
          className="mt-2 w-full rounded border p-3"
        />
      </label>
      <datalist id="gallery-category-suggestions">
        {suggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <p className="text-sm text-slate-600">
        Deactivating a category prevents new selections and preserves existing
        items.
      </p>
      <button
        disabled={busy}
        className="bg-primary rounded-lg px-4 py-2 font-bold text-white"
      >
        {busy ? "Adding…" : "Add category"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
