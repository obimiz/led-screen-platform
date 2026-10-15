"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { salesFetch } from "@/components/sales/client-api";
export function GalleryCategoryEditor({
  id,
  name,
  isActive,
}: {
  id: string;
  name: string;
  isActive: boolean;
}) {
  const [value, setValue] = useState(name);
  const [active, setActive] = useState(isActive);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form
      className="space-y-3 rounded border p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await salesFetch(`/api/gallery/categories/${id}`, "PUT", {
            name: value,
            isActive: active,
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
      <label className="block">
        Category name
        <input
          aria-label={`Rename ${name}`}
          className="mt-2 w-full rounded border p-2"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          minLength={2}
          maxLength={120}
        />
      </label>
      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Active for new selections
      </label>
      <button disabled={busy} className="rounded border px-3 py-2">
        {busy ? "Saving…" : "Save category"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
