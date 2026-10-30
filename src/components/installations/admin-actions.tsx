"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { salesFetch } from "@/components/sales/client-api";
import { buttonClass } from "@/components/sales/ui";
export function InstallationRequestActions({
  id,
  version,
}: {
  id: string;
  version: number;
}) {
  const [busy, setBusy] = useState(false);
  const r = useRouter();
  async function act(path: string, body?: unknown) {
    setBusy(true);
    try {
      await salesFetch(path, body ? "PUT" : "POST", body);
      r.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button
        disabled={busy}
        className={buttonClass}
        onClick={() => act(`/api/installation-requests/${id}/quotation`)}
      >
        Create Quotation
      </button>
      <button
        disabled={busy}
        className="rounded-lg border px-4 py-2 text-sm"
        onClick={() =>
          act(`/api/site-assessments?requestId=${id}`, {
            scheduledDate: "",
            scheduledTime: "",
            assignedStaff: [],
            status: "scheduled",
          })
        }
      >
        Schedule Assessment
      </button>
      <select
        className="rounded-lg border px-3"
        disabled={busy}
        defaultValue="new"
        onChange={(e) =>
          act(`/api/installation-requests/${id}`, {
            status: e.target.value,
            assignedTo: "",
            adminNotes: "",
            version,
          })
        }
      >
        <option>new</option>
        <option>contacted</option>
        <option>assessment-required</option>
        <option>reviewing</option>
        <option>quoted</option>
        <option>accepted</option>
        <option>declined</option>
        <option>closed</option>
      </select>
    </div>
  );
}
