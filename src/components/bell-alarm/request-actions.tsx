"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { salesFetch } from "@/components/sales/client-api";
import { buttonClass } from "@/components/sales/ui";
export function BellAlarmRequestActions({
  id,
  version,
}: {
  id: string;
  version: number;
}) {
  const [busy, setBusy] = useState(false);
  const r = useRouter();
  return (
    <div className="flex flex-wrap gap-3">
      <button
        className={buttonClass}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await salesFetch(
              `/api/bell-alarm-requests/${id}/quotation`,
              "POST",
            );
            r.refresh();
          } finally {
            setBusy(false);
          }
        }}
      >
        Create Quotation
      </button>
      <select
        className="rounded-lg border px-3"
        defaultValue="new"
        onChange={async (e) => {
          setBusy(true);
          try {
            await salesFetch(`/api/bell-alarm-requests/${id}`, "PUT", {
              status: e.target.value,
              assignedTo: "",
              adminNotes: "",
              version,
            });
            r.refresh();
          } finally {
            setBusy(false);
          }
        }}
      >
        <option>new</option>
        <option>contacted</option>
        <option>reviewing</option>
        <option>assessment-required</option>
        <option>quoted</option>
        <option>accepted</option>
        <option>declined</option>
        <option>closed</option>
      </select>
    </div>
  );
}
