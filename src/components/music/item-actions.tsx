"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { salesFetch } from "@/components/sales/client-api";
export function MusicActions({
  id,
  status,
  featured,
}: {
  id: string;
  status: string;
  featured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function save(data: object) {
    setBusy(true);
    setMessage("");
    try {
      await salesFetch(`/api/music/${id}`, "PUT", data);
      setMessage("Music saved");
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
                "Archive this music? Public playback will be disabled. The record and audio files will be retained.",
              )
            )
              void save({ status: "archived" });
          }}
        >
          Archive
        </button>
      )}
      {busy && <span role="status">Saving…</span>}
      {message && (
        <p role="status" className="w-full text-sm">
          {message}
        </p>
      )}
    </div>
  );
}
