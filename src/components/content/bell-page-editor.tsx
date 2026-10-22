"use client";
import { useState } from "react";
import Link from "next/link";
import { RichEditor } from "@/components/publishing/editor";
import { ContentMediaManager } from "@/components/publishing/media-manager";
import { ProductImagePicker } from "@/components/products/product-image-picker";
import { BellPageView } from "./bell-page-view";
import {
  bellPageSchema,
  type BellPageContent,
} from "@/lib/validations/bell-page";
export function BellPageEditor({ initial }: { initial: BellPageContent }) {
  const [value, setValue] = useState(initial),
    [saved, setSaved] = useState(initial),
    [preview, setPreview] = useState(false),
    [editorVersion, setEditorVersion] = useState(0),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [message, setMessage] = useState("");
  async function save(action: "draft" | "publish") {
    const parsed = bellPageSchema.safeParse(value);
    if (!parsed.success) {
      setMessage(
        parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      );
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/electronic-bell", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, content: parsed.data }),
      });
      const b = await r.json();
      if (!r.ok) throw Error(b.message);
      setSaved(value);
      setMessage(b.message);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const textFields = [
    ["heading", "Main heading"],
    ["subtitle", "Subtitle"],
    ["introduction", "Introduction"],
    ["heroImage", "Hero image URL"],
    ["heroAlt", "Hero image alt text"],
    ["sectionHeading", "Section heading"],
    ["showcaseText", "Product showcase text"],
    ["ctaText", "Contact CTA text"],
    ["seoTitle", "SEO title"],
    ["seoDescription", "SEO description"],
  ] as const;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link className="underline" href="/admin/bell-alarm/products">
          Manage bell products
        </Link>
        <a
          className="underline"
          href="/electronic-bell-alarm"
          target="_blank"
          rel="noreferrer"
        >
          View published page
        </a>
      </div>
      <p>
        Save a draft while the published page stays live. Preview includes
        unsaved changes.
      </p>
      {preview ? (
        <>
          <button
            className="rounded border p-3"
            onClick={() => setPreview(false)}
          >
            Back to editor
          </button>
          <BellPageView content={value} />
        </>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            {textFields.map(([key, label]) => (
              <label key={key} className="block text-sm font-semibold">
                {label}
                <textarea
                  rows={key === "introduction" ? 4 : 2}
                  className="mt-2 w-full rounded-lg border p-3"
                  value={value[key]}
                  onChange={(e) =>
                    setValue({ ...value, [key]: e.target.value })
                  }
                />
              </label>
            ))}
          </div>
          <h2 className="font-bold">Hero photograph</h2>
          <ProductImagePicker
            hasFeaturedImage={!!value.heroImage}
            onBusyChange={setUploading}
            onSelect={(url) => setValue({ ...value, heroImage: url })}
          />
          <RichEditor
            key={editorVersion}
            initial={value.content}
            onChange={(content) => setValue((v) => ({ ...v, content }))}
            onBusyChange={setUploading}
          />
          <ContentMediaManager
            value={value}
            onChange={(media) => setValue((v) => ({ ...v, ...media }))}
            onBusyChange={setUploading}
          />
        </>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          disabled={busy || uploading}
          className="rounded border px-4 py-3 disabled:opacity-50"
          onClick={() => save("draft")}
        >
          Save Draft
        </button>
        <button
          className="rounded border px-4 py-3"
          onClick={() => setPreview(!preview)}
        >
          Preview
        </button>
        <button
          disabled={busy || uploading}
          className="rounded bg-[#DD2421] px-4 py-3 font-bold text-white disabled:opacity-50"
          onClick={() => save("publish")}
        >
          Publish Changes
        </button>
        <button
          className="rounded border px-4 py-3"
          onClick={() => {
            setValue(saved);
            setEditorVersion((v) => v + 1);
            setPreview(false);
            setMessage("Unsaved changes discarded.");
          }}
        >
          Discard unsaved changes
        </button>
      </div>
      <p role="status">{message}</p>
    </div>
  );
}
