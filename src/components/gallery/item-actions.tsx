"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { salesFetch } from "@/components/sales/client-api";
export function GalleryItemActions({
  id,
  status,
  featured,
}: {
  id: string;
  status: string;
  featured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function update(data: object) {
    setBusy(true);
    setError("");
    try {
      await salesFetch(`/api/gallery/${id}`, "PUT", data);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button
        disabled={busy}
        className="rounded border px-3 py-2"
        onClick={() =>
          update({ status: status === "published" ? "draft" : "published" })
        }
      >
        {status === "published" ? "Unpublish" : "Publish"}
      </button>
      <button
        disabled={busy}
        className="rounded border px-3 py-2"
        onClick={() => update({ featured: !featured })}
      >
        {featured ? "Unfeature" : "Feature"}
      </button>
      {status !== "archived" && (
        <button
          disabled={busy}
          className="rounded border px-3 py-2"
          onClick={() => {
            if (
              confirm(
                "Archive this gallery item? It will be hidden publicly. Its record and image assets will be retained.",
              )
            )
              void update({ status: "archived" });
          }}
        >
          Archive
        </button>
      )}
      {busy && <span role="status">Saving…</span>}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
