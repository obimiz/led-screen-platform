"use client";

import { useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { ProductImage } from "@/components/products/product-media";
import { getProductDisplayImages } from "@/lib/media/product-primary-image";

export function AccessoryGallery({
  name,
  featuredImageUrl,
  imageAlt,
  imageUrls,
  imageAlts,
  compact = false,
}: {
  name: string;
  featuredImageUrl: string;
  imageAlt: string;
  imageUrls: string[];
  imageAlts: string[];
  compact?: boolean;
}) {
  const images = getProductDisplayImages({ featuredImageUrl, imageUrls });
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const index = Math.min(selected, Math.max(images.length - 1, 0));
  const url = images[index] || "";
  const alt = (src: string) =>
    (src === featuredImageUrl ? imageAlt : imageAlts[imageUrls.indexOf(src)]) ||
    `${name}, image ${images.indexOf(src) + 1}`;
  const move = (step: number) => {
    if (images.length > 1)
      setSelected(
        (current) => (current + step + images.length) % images.length,
      );
  };
  const keyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    }
  };
  const touchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.changedTouches[0];
    start.current = { x: touch.clientX, y: touch.clientY };
    swiped.current = false;
  };
  const touchEnd = (event: TouchEvent<HTMLElement>) => {
    const touch = event.changedTouches[0],
      origin = start.current;
    start.current = null;
    if (!origin) return;
    const dx = touch.clientX - origin.x,
      dy = touch.clientY - origin.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      swiped.current = true;
      move(dx < 0 ? 1 : -1);
    }
  };
  const controls = () =>
    images.length > 1 && (
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-lg border px-4 py-2"
          onClick={() => move(-1)}
        >
          ← Previous image
        </button>
        <p aria-live="polite" className="text-sm">
          {index + 1} / {images.length}
        </p>
        <button
          type="button"
          className="rounded-lg border px-4 py-2"
          onClick={() => move(1)}
        >
          Next image →
        </button>
      </div>
    );
  return (
    <section
      aria-label={`${name} image gallery`}
      className="min-w-0"
      onKeyDown={keyboard}
    >
      <div className="relative">
        <button
          type="button"
          disabled={!url}
          onClick={() => {
            if (swiped.current) {
              swiped.current = false;
              return;
            }
            dialog.current?.showModal();
          }}
          aria-label="Enlarge product image"
          className="block w-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4"
          onTouchStart={touchStart}
          onTouchEnd={touchEnd}
          style={{ touchAction: "pan-y pinch-zoom" }}
        >
          <ProductImage
            key={url}
            url={url}
            name={alt(url)}
            fit="contain"
            neutralFallback
            priority={!compact}
            className={`aspect-[4/3] ${compact ? "" : "rounded-2xl"}`}
          />
        </button>
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => move(-1)}
              className="absolute top-1/2 left-2 grid size-11 -translate-y-1/2 place-items-center rounded-full border bg-white/95 text-2xl text-[#28146B] shadow-sm"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => move(1)}
              className="absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center rounded-full border bg-white/95 text-2xl text-[#28146B] shadow-sm"
            >
              ›
            </button>
            <span
              aria-live="polite"
              className="absolute right-3 bottom-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <p
          className={`text-center text-sm font-semibold text-[#28146B] ${compact ? "px-3 py-2" : "mt-3"}`}
        >
          Click the side arrows to see more images
        </p>
      )}
      {!compact && images.length > 1 && (
        <div
          className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5"
          aria-label="Product image thumbnails"
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Show product image ${i + 1}`}
              aria-pressed={index === i}
              onClick={() => setSelected(i)}
              className={`overflow-hidden rounded-lg border-2 ${index === i ? "border-brand-700" : "border-transparent"}`}
            >
              <ProductImage
                url={src}
                name={alt(src)}
                fit="contain"
                neutralFallback
                className="aspect-[4/3]"
              />
            </button>
          ))}
        </div>
      )}
      <dialog
        ref={dialog}
        onClose={() => {
          swiped.current = false;
        }}
        aria-label={`${name} enlarged image`}
        className="m-auto max-h-[95dvh] w-[95vw] max-w-6xl overflow-auto rounded-xl bg-white p-4 backdrop:bg-black/80"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="flex justify-end">
          <button
            type="button"
            autoFocus
            className="rounded-lg border px-4 py-2"
            onClick={() => dialog.current?.close()}
          >
            Close image viewer
          </button>
        </div>
        <div
          className="mt-3"
          onTouchStart={touchStart}
          onTouchEnd={touchEnd}
          style={{ touchAction: "pan-y pinch-zoom" }}
        >
          <ProductImage
            key={url}
            url={url}
            name={alt(url)}
            fit="contain"
            neutralFallback
            priority
            className="h-[65dvh] w-full rounded-lg"
          />
        </div>
        {controls()}
      </dialog>
    </section>
  );
}
