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
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  async function archive() {
    if (
      !window.confirm(
        archived ? "Restore this accessory to draft?" : "Archive this product?",
      )
    )
      return;
    setPending(true);
    setMessage("");
    setFailed(false);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType,
          action: archived ? "restore" : "archive",
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.message || "Unable to archive product.");
      setMessage(body.message);
      if (productType === "led-screen") {
        const destination = new URL(window.location.href);
        destination.pathname = "/admin/products";
        destination.searchParams.set("archived", "1");
        router.push(destination.pathname + destination.search);
      }
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={archive}
        disabled={pending}
        className="text-sm font-semibold text-red-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : archived ? "Restore" : "Archive"}
      </button>
      {message && (
        <span role={failed ? "alert" : "status"} className="text-xs">
          {message}
        </span>
      )}
    </span>
  );
}
