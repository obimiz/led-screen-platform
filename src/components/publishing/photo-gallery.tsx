"use client";
import Image from "next/image";
import { useRef, useState } from "react";
export function ProjectPhotos({
  images,
  alts,
  title,
  article = false,
}: {
  images: string[];
  alts: string[];
  title: string;
  article?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const move = (n: number) =>
    setIndex((i) => (i + n + images.length) % images.length);
  if (!images.length) return null;
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold">
        {article ? "Additional photographs" : "Project photographs"}
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((src, i) => (
          <figure key={`${src}-${i}`}>
            <button
              className="focus-visible:ring-brand-700 relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-50 focus-visible:ring-4"
              aria-label={`Enlarge photograph ${i + 1}`}
              onClick={() => {
                setIndex(i);
                dialog.current?.showModal();
              }}
            >
              <Image
                src={src}
                alt={alts[i] || `${title}, photograph ${i + 1}`}
                fill
                sizes="(max-width:640px) 100vw,33vw"
                unoptimized={!src.startsWith("/")}
                className="object-cover"
              />
            </button>
            <figcaption className="mt-2 text-sm text-slate-600">
              {alts[i]}
            </figcaption>
          </figure>
        ))}
      </div>
      <dialog
        ref={dialog}
        aria-label="Project photograph viewer"
        className="m-auto w-[95vw] max-w-6xl rounded-xl bg-slate-950 p-4 text-white backdrop:bg-black/80"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            move(1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            move(-1);
          }
        }}
      >
        <div className="flex flex-wrap justify-between gap-3">
          <button className="rounded border p-2" onClick={() => move(-1)}>
            ← Previous
          </button>
          <button
            className="rounded border p-2"
            onClick={() => dialog.current?.close()}
          >
            Close viewer
          </button>
          <button className="rounded border p-2" onClick={() => move(1)}>
            Next →
          </button>
        </div>
        <div className="relative mt-4 h-[65dvh]">
          <Image
            src={images[index]}
            alt={alts[index] || title}
            fill
            sizes="95vw"
            unoptimized={!images[index].startsWith("/")}
            className="object-contain"
          />
        </div>
        <p className="mt-3 text-center" aria-live="polite">
          {index + 1} / {images.length} · {alts[index]}
        </p>
      </dialog>
    </section>
  );
}
