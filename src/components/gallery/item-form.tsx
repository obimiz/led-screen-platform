"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { salesFetch } from "@/components/sales/client-api";
import { buttonClass, inputClass, Field } from "@/components/sales/ui";
import { ProductImage } from "@/components/products/product-media";
type Option = { id: string; name: string; isActive?: boolean };
type Item = {
  id?: string;
  title: string;
  caption: string;
  description: string;
  categoryId: string;
  productId: string;
  altText: string;
  imageUrl: string;
  featured: boolean;
  sortOrder: number;
  status: string;
  mediaType: string;
  videoUrl: string;
  thumbnailUrl: string;
};
export function GalleryItemForm({
  initial,
  categories,
  products,
}: {
  initial?: Partial<Item>;
  categories: Option[];
  products: Option[];
}) {
  const router = useRouter();
  const [item, setItem] = useState<Item>({
    title: "",
    caption: "",
    description: "",
    altText: "",
    imageUrl: "",
    featured: false,
    sortOrder: 0,
    status: "draft",
    mediaType: "image",
    videoUrl: "",
    thumbnailUrl: "",
    ...initial,
    categoryId: initial?.categoryId || "",
    productId: initial?.productId || "",
  });
  const [extra, setExtra] = useState<string[]>([]);
  const [library, setLibrary] = useState<{ url: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/product-images")
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw Error(b.message);
        setLibrary(b.images);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const linkHandler = (e: MouseEvent) => {
      const anchor =
        e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (dirty && anchor && !confirm("Discard unsaved gallery changes?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", handler);
    document.addEventListener("click", linkHandler, true);
    return () => {
      window.removeEventListener("beforeunload", handler);
      document.removeEventListener("click", linkHandler, true);
    };
  }, [dirty]);
  function change<K extends keyof Item>(key: K, value: Item[K]) {
    setItem((v) => ({ ...v, [key]: value }));
    setDirty(true);
  }
  function addImage(url: string) {
    if (!url) return;
    setDirty(true);
    if (!item.imageUrl)
      setItem((v) => ({ ...v, imageUrl: url, thumbnailUrl: "" }));
    else
      setExtra((v) =>
        v.includes(url) || url === item.imageUrl ? v : [...v, url],
      );
  }
  async function save(status: string) {
    setBusy(true);
    setError("");
    try {
      const payload = { ...item, status };
      if (item.id) await salesFetch(`/api/gallery/${item.id}`, "PUT", payload);
      else {
        const urls =
          item.mediaType === "image"
            ? [item.imageUrl, ...extra]
            : [item.imageUrl];
        for (let n = 0; n < urls.length; n++) {
          await salesFetch("/api/gallery", "POST", {
            ...payload,
            imageUrl: urls[n],
            title: n ? `${item.title} (${n + 1})` : item.title,
            sortOrder: item.sortOrder + n,
          });
          if (n < urls.length - 1) {
            setItem((v) => ({
              ...v,
              imageUrl: urls[n + 1],
              sortOrder: item.sortOrder + n + 1,
            }));
            setExtra(urls.slice(n + 2));
            setMessage(`${n + 1} image(s) saved.`);
          }
        }
      }
      setDirty(false);
      router.push("/admin/gallery?saved=1");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="max-w-3xl space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void save(item.status);
      }}
    >
      <p className="text-slate-600">
        Describe what the image actually shows. Product photographs do not imply
        a completed client installation.
      </p>
      <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
        <Field label="Title">
          <input
            className={inputClass}
            required
            minLength={2}
            maxLength={180}
            value={item.title}
            onChange={(e) => change("title", e.target.value)}
          />
        </Field>
        <Field label="Caption">
          <input
            className={inputClass}
            maxLength={500}
            value={item.caption}
            onChange={(e) => change("caption", e.target.value)}
          />
        </Field>
        <Field label="Detailed description (optional)">
          <textarea
            className={inputClass}
            rows={4}
            maxLength={3000}
            value={item.description}
            onChange={(e) => change("description", e.target.value)}
          />
        </Field>
        <Field label="Category">
          <select
            className={inputClass}
            value={item.categoryId}
            onChange={(e) => change("categoryId", e.target.value)}
          >
            <option value="">Uncategorised</option>
            {categories
              .filter((c) => c.isActive !== false || c.id === item.categoryId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isActive === false ? " (inactive)" : ""}
                </option>
              ))}
          </select>
        </Field>
        <Link href="/admin/gallery/categories" className="underline">
          Manage categories
        </Link>
        <Field label="Associated product (optional)">
          <select
            className={inputClass}
            value={item.productId}
            onChange={(e) => change("productId", e.target.value)}
          >
            <option value="">None</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        {item.mediaType === "video" ? (
          <Field label="Video URL">
            <input
              className={inputClass}
              value={item.videoUrl}
              onChange={(e) => change("videoUrl", e.target.value)}
            />
          </Field>
        ) : (
          <>
            <Field label="Upload images (PNG, JPEG or WebP, up to 4 MB each)">
              <input
                type="file"
                multiple={!item.id}
                accept="image/png,image/jpeg,image/webp"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  e.target.value = "";
                  setError("");
                  setBusy(true);
                  try {
                    let hasPrimary = !!item.imageUrl;
                    for (const file of files) {
                      if (file.size > 4 * 1024 * 1024)
                        throw Error(`${file.name}: maximum size is 4 MB`);
                      if (
                        !["image/png", "image/jpeg", "image/webp"].includes(
                          file.type,
                        )
                      )
                        throw Error("Choose PNG, JPEG or WebP images");
                      setMessage(`Uploading ${file.name}…`);
                      const r = await fetch("/api/product-images", {
                        method: "POST",
                        headers: {
                          "Content-Type": file.type,
                          "X-File-Name": encodeURIComponent(file.name),
                        },
                        body: file,
                      });
                      const b = await r.json();
                      if (!r.ok) throw Error(b.message);
                      setLibrary((v) => [
                        { url: b.url, name: file.name },
                        ...v,
                      ]);
                      if (item.id || !hasPrimary) {
                        setItem((v) => ({
                          ...v,
                          imageUrl: b.url,
                          thumbnailUrl: "",
                        }));
                        hasPrimary = true;
                      } else setExtra((v) => [...v, b.url]);
                      setDirty(true);
                    }
                    setMessage("Images ready. Save to apply changes.");
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </Field>
            <Field label="Select from image library">
              <select
                className={inputClass}
                value=""
                onChange={(e) => {
                  if (item.id) {
                    change("imageUrl", e.target.value);
                    change("thumbnailUrl", "");
                  } else addImage(e.target.value);
                }}
              >
                <option value="">
                  Choose an image
                  {item.id ? " to replace the current image" : ""}
                </option>
                {library.map((i) => (
                  <option key={i.url} value={i.url}>
                    {i.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[item.imageUrl, ...extra].filter(Boolean).map((url, index) => (
                <div key={`${url}-${index}`}>
                  <ProductImage
                    url={url}
                    name={item.altText || "Selected image"}
                    fit="contain"
                  />
                  <button
                    type="button"
                    className="mt-2 rounded border px-3 py-2"
                    onClick={() => {
                      if (index === 0) {
                        change("imageUrl", extra[0] || "");
                        change("thumbnailUrl", "");
                        setExtra((v) => v.slice(1));
                      } else {
                        setExtra((v) => v.filter((_, i) => i !== index - 1));
                        setDirty(true);
                      }
                    }}
                  >
                    Remove image {index + 1}
                  </button>
                </div>
              ))}
            </div>
            {!item.id && extra.length > 0 && (
              <p>
                Each image will become a separate gallery item with these
                details. You can edit them individually afterward.
              </p>
            )}
            <Field label="Alternative text (describe the image)">
              <input
                className={inputClass}
                required
                maxLength={240}
                value={item.altText}
                onChange={(e) => change("altText", e.target.value)}
              />
            </Field>
          </>
        )}
        <Field label="Display order (lower numbers first)">
          <input
            type="number"
            min={0}
            step={1}
            className={inputClass}
            value={item.sortOrder}
            onChange={(e) => change("sortOrder", Number(e.target.value))}
          />
        </Field>
        <label className="flex gap-3">
          <input
            type="checkbox"
            checked={item.featured}
            onChange={(e) => change("featured", e.target.checked)}
          />
          Featured on homepage when published
        </label>
        <Field label="Publication status">
          <select
            className={inputClass}
            value={item.status}
            onChange={(e) => change("status", e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            {item.status === "archived" && (
              <option value="archived">Archived</option>
            )}
          </select>
        </Field>
        <div className="flex flex-wrap gap-3">
          <button className={buttonClass}>
            Save {item.status === "published" ? "and publish" : "changes"}
          </button>
          <button
            type="submit"
            className="rounded-lg border px-4 py-2"
            onClick={() => setItem((v) => ({ ...v, status: "draft" }))}
          >
            Save as Draft
          </button>
          <button
            type="submit"
            className="bg-primary rounded-lg px-4 py-2 text-white"
            onClick={() => setItem((v) => ({ ...v, status: "published" }))}
          >
            Publish
          </button>
          <Link className="px-4 py-2 underline" href="/admin/gallery">
            Cancel
          </Link>
        </div>
      </fieldset>
      {busy && <p role="status">Working…</p>}
      {message && <p role="status">{message}</p>}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
