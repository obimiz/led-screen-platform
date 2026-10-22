"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { salesFetch } from "@/components/sales/client-api";
export function PublishingActions({
  id,
  status,
  featured,
}: {
  id: string;
  status: string;
  featured: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  async function save(data: object, method = "PUT") {
    setBusy(true);
    setMessage("");
    try {
      await salesFetch(`/api/portfolio/${id}`, method, data);
      setMessage(
        method === "DELETE"
          ? "Post deleted. Images retained."
          : "Post updated.",
      );
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
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
          save({ status: status === "published" ? "draft" : "published" })
        }
      >
        {status === "published" ? "Unpublish" : "Publish"}
      </button>
      <button
        disabled={busy}
        className="rounded border px-3 py-2"
        onClick={() => save({ featured: !featured })}
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
                "Archive this post? It will be hidden publicly; the record and all images will be retained.",
              )
            )
              void save({ status: "archived" });
          }}
        >
          Archive
        </button>
      )}
      <button
        disabled={busy}
        className="rounded border border-red-200 px-3 py-2 text-red-700"
        onClick={() => {
          if (
            confirm(
              "Permanently delete this post? This cannot be undone. Stored image assets and all other records will be retained.",
            )
          )
            void save({ confirm: true }, "DELETE");
        }}
      >
        Delete
      </button>
      {(busy || message) && (
        <p className="w-full text-sm" role="status">
          {busy ? "Saving…" : message}
        </p>
      )}
    </div>
  );
}
