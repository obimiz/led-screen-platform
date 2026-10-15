"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
type Item = {
  id: string;
  slug: string;
  title: string;
  caption?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  mediaType: string;
  altText?: string;
  productId?: string;
};
export function GalleryGrid({ items }: { items: Item[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const images = items.filter((x) => x.mediaType === "image" && x.imageUrl);
  const current = images[index];
  function open(id: string) {
    setIndex(images.findIndex((i) => i.id === id));
    dialog.current?.showModal();
  }
  function move(step: number) {
    setIndex((i) => (i + step + images.length) % images.length);
  }
  return (
    <>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((x) => (
          <article key={x.id} className="overflow-hidden rounded-xl border">
            <div className="relative aspect-[4/3] bg-slate-100">
              {x.mediaType === "image" && x.imageUrl ? (
                <button
                  className="relative block h-full w-full focus-visible:ring-4 focus-visible:ring-[#84C221]"
                  aria-label={`Enlarge ${x.title}`}
                  onClick={() => open(x.id)}
                >
                  <Image
                    src={x.thumbnailUrl || x.imageUrl}
                    alt={x.altText || x.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized={
                      !(x.thumbnailUrl || x.imageUrl).startsWith("/")
                    }
                    className={x.productId ? "object-contain" : "object-cover"}
                  />
                </button>
              ) : (
                <Link
                  className="flex h-full items-center justify-center"
                  href={`/gallery/${x.slug}`}
                >
                  View video
                </Link>
              )}
            </div>
            <div className="p-4">
              <h2 className="font-bold">
                <Link href={`/gallery/${x.slug}`}>{x.title}</Link>
              </h2>
              {x.caption && (
                <p className="mt-2 text-sm text-slate-600">{x.caption}</p>
              )}
            </div>
          </article>
        ))}
      </div>
      <dialog
        ref={dialog}
        aria-label="Enlarged gallery image"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            move(-1);
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            move(1);
          }
        }}
        className="m-auto max-h-[95vh] w-[95vw] max-w-6xl rounded-xl bg-white p-4 backdrop:bg-black/80"
      >
        {current && (
          <>
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-bold">{current.title}</h2>
              <button
                autoFocus
                className="rounded border p-3"
                onClick={() => dialog.current?.close()}
              >
                Close
              </button>
            </div>
            <div className="relative mt-4 h-[65vh]">
              <Image
                src={current.imageUrl}
                alt={current.altText || current.title}
                fill
                unoptimized
                className="object-contain"
                sizes="95vw"
              />
            </div>
            <p className="mt-3">{current.caption}</p>
            <div className="mt-4 flex items-center justify-between">
              <button className="rounded border p-3" onClick={() => move(-1)}>
                Previous
              </button>
              <span>
                {index + 1} / {images.length}
              </span>
              <button className="rounded border p-3" onClick={() => move(1)}>
                Next
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
