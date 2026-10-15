"use client";
import { useEffect, useId, useState } from "react";
import { ProductImage } from "./product-media";
export function ProductImagePicker({
  onSelect,
  onBusyChange,
  hasFeaturedImage = false,
  galleryFull = false,
}: {
  onSelect: (url: string, featured: boolean) => void;
  onBusyChange?: (busy: boolean) => void;
  hasFeaturedImage?: boolean;
  galleryFull?: boolean;
}) {
  const libraryId = useId();
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/product-images")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.message);
        setImages(body.images);
      })
      .catch((error) => setMessage(error.message));
  }, []);
  return (
    <div className="space-y-3 sm:col-span-2">
      <label className="block text-sm font-semibold">
        Upload product image (PNG, JPEG or WebP, maximum 4 MB)
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          className="mt-2 block"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (file.size > 4 * 1024 * 1024) {
              setMessage("Maximum image size is 4 MB.");
              return;
            }
            setBusy(true);
            onBusyChange?.(true);
            setMessage("");
            try {
              const response = await fetch("/api/product-images", {
                method: "POST",
                headers: {
                  "Content-Type": file.type,
                  "X-File-Name": encodeURIComponent(file.name),
                },
                body: file,
              });
              const body = await response.json();
              if (!response.ok) throw new Error(body.message);
              setImages((items) => [
                { url: body.url, name: file.name },
                ...items,
              ]);
              setSelected(body.url);
              if (!hasFeaturedImage) {
                onSelect(body.url, true);
                setMessage(
                  "Image uploaded and selected as the featured image. Save the product to apply it.",
                );
              } else if (!galleryFull) {
                onSelect(body.url, false);
                setMessage(
                  "Image uploaded and added to the product gallery. Save the product to apply it.",
                );
              } else {
                setMessage(
                  "Image uploaded to the library. The product gallery is full; choose Use as featured image to replace the main image, then save.",
                );
              }
            } catch (error) {
              setMessage((error as Error).message);
            } finally {
              setBusy(false);
              onBusyChange?.(false);
            }
          }}
        />
      </label>
      <label htmlFor={libraryId} className="block text-sm font-semibold">
        Select an existing image
      </label>
      <select
        id={libraryId}
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
        className="w-full rounded-lg border p-3"
      >
        <option value="">Choose image</option>
        {images.map((image) => (
          <option key={image.url} value={image.url}>
            {image.name}
          </option>
        ))}
      </select>
      {selected && (
        <ProductImage
          url={selected}
          name="Selected product image"
          fit="contain"
          className="relative block size-40"
        />
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!selected || busy}
          onClick={() => onSelect(selected, true)}
          className="rounded-lg border px-3 py-2 disabled:opacity-50"
        >
          Use as featured image
        </button>
        <button
          type="button"
          disabled={!selected || busy || galleryFull}
          onClick={() => onSelect(selected, false)}
          className="rounded-lg border px-3 py-2 disabled:opacity-50"
        >
          Add to gallery
        </button>
      </div>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {busy && <p role="status">Uploading…</p>}
    </div>
  );
}
