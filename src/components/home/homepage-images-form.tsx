"use client";
import { useState } from "react";
import Link from "next/link";
import { ProductImagePicker } from "@/components/products/product-image-picker";
import { ProductImage } from "@/components/products/product-media";
import {
  homepageImagesSchema,
  type HomepageImages,
} from "@/lib/validations/homepage-images";
export function HomepageImagesForm({ initial }: { initial: HomepageImages }) {
  const [value, setValue] = useState(initial),
    [saved, setSaved] = useState(initial),
    [uploading, setUploading] = useState({ bell: false, camera: false }),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState("");
  const busy = saving || uploading.bell || uploading.camera;
  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setMessage("");
        const parsed = homepageImagesSchema.safeParse(value);
        if (!parsed.success) {
          setMessage(parsed.error.issues.map((i) => i.message).join(" "));
          return;
        }
        setSaving(true);
        try {
          const response = await fetch("/api/settings/homepage-images", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed.data),
          });
          const body = await response.json();
          if (!response.ok) throw Error(body.message);
          setSaved(parsed.data);
          setMessage(body.message);
        } catch (error) {
          setMessage((error as Error).message);
        } finally {
          setSaving(false);
        }
      }}
    >
      <p className="max-w-3xl leading-7 text-slate-600">
        Choose a bell photograph and a camera photograph to display beside their
        homepage descriptions. Upload from your computer or select an existing
        image. On mobile, each photograph appears above its write-up.
      </p>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {(["bell", "camera"] as const).map((kind) => {
          const urlKey = kind === "bell" ? "bellImageUrl" : "cameraImageUrl",
            altKey = kind === "bell" ? "bellImageAlt" : "cameraImageAlt";
          return (
            <fieldset
              key={kind}
              disabled={saving}
              className="min-w-0 space-y-4 rounded-2xl border bg-white p-5"
            >
              <legend className="px-2 text-lg font-bold">
                {kind === "bell"
                  ? "Electronic Bell homepage photo"
                  : "LED Screen Camera homepage photo"}
              </legend>
              {value[urlKey] && (
                <ProductImage
                  url={value[urlKey]}
                  name={
                    value[altKey] ||
                    (kind === "bell" ? "Electronic bell" : "LED screen camera")
                  }
                  neutralFallback
                  fit="contain"
                  className="aspect-[4/3] rounded-lg"
                />
              )}
              <ProductImagePicker
                featuredOnly
                hasFeaturedImage={Boolean(value[urlKey])}
                onBusyChange={(v) =>
                  setUploading((previous) => ({ ...previous, [kind]: v }))
                }
                onSelect={(url) =>
                  setValue((previous) => ({ ...previous, [urlKey]: url }))
                }
              />
              <label className="block text-sm font-semibold">
                {kind === "bell"
                  ? "Bell image alt text"
                  : "Camera image alt text"}
                <input
                  className="mt-2 w-full rounded-lg border p-3"
                  maxLength={300}
                  value={value[altKey]}
                  onChange={(e) =>
                    setValue((previous) => ({
                      ...previous,
                      [altKey]: e.target.value,
                    }))
                  }
                />
              </label>
              {value[urlKey] && (
                <button
                  type="button"
                  disabled={busy}
                  className="rounded border px-3 py-2"
                  onClick={() =>
                    setValue((previous) => ({
                      ...previous,
                      [urlKey]: "",
                      [altKey]: "",
                    }))
                  }
                >
                  Remove photo
                </button>
              )}
              <p className="text-sm text-slate-600">
                Your selected photo takes priority over the featured product
                photo. Removing it restores the automatic product photo when one
                is available.
              </p>
            </fieldset>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          disabled={busy}
          className="rounded-lg bg-[#DD2421] px-5 py-3 font-bold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save homepage images"}
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-lg border px-5 py-3"
          onClick={() => {
            setValue(saved);
            setMessage("Unsaved changes discarded.");
          }}
        >
          Discard unsaved changes
        </button>
        <Link
          href="/"
          target="_blank"
          className="px-4 py-3 font-bold underline"
        >
          View homepage
        </Link>
      </div>
      <p role="status">{message}</p>
    </form>
  );
}
