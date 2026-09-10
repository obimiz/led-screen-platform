"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function ArchiveProductButton({
  id,
  productType = "led-screen",
  archived = false,
}: {
  id: string;
  productType?: "led-screen" | "led-accessory";
  archived?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function archive() {
    if (
      !window.confirm(
        archived ? "Restore this accessory to draft?" : "Archive this product?",
      )
    )
      return;
    setPending(true);
    const response = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productType,
        action: archived ? "restore" : "archive",
      }),
    });
    if (response.ok) router.refresh();
    else setPending(false);
  }
  return (
    <button
      type="button"
      onClick={archive}
      disabled={pending}
      className="text-sm font-semibold text-red-700 disabled:opacity-50"
    >
      {pending ? "Saving…" : archived ? "Restore" : "Archive"}
    </button>
  );
}
