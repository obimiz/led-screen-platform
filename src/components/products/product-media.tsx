"use client";
import Image from "next/image";
import { useCallback, useState } from "react";
import { normalizePublicImageUrl } from "@/lib/media/product-primary-image";

const DEFAULT_PRODUCT_IMAGE_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

export function ProductImage({
  url,
  name,
  className = "aspect-video",
  priority = false,
  fit = "cover",
  neutralFallback = false,
  sizes = DEFAULT_PRODUCT_IMAGE_SIZES,
}: {
  url: string;
  name: string;
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  neutralFallback?: boolean;
  sizes?: string;
}) {
  const normalizedUrl = normalizePublicImageUrl(url);
  const [failed, setFailed] = useState("");
  const checkImage = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image || !normalizedUrl) return;
      if (image.complete && !image.naturalWidth) {
        setFailed(normalizedUrl);
        return;
      }
      image.addEventListener("error", () => setFailed(normalizedUrl), {
        once: true,
      });
    },
    [normalizedUrl],
  );
  const unoptimized =
    !normalizedUrl.startsWith("/") ||
    normalizedUrl.toLowerCase().endsWith(".svg");

  return normalizedUrl && failed !== normalizedUrl ? (
    <span
      className={`relative block overflow-hidden bg-slate-100 ${className}`}
    >
      <Image
        ref={checkImage}
        src={normalizedUrl}
        overrideSrc={normalizedUrl}
        onLoad={(event) => checkImage(event.currentTarget)}
        alt={name}
        fill
        sizes={sizes}
        preload={priority}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        unoptimized={unoptimized}
        style={{ objectFit: fit, objectPosition: "center" }}
        className={fit === "contain" ? "p-4" : undefined}
      />
    </span>
  ) : neutralFallback ? (
    <span
      className={`relative grid place-items-center overflow-hidden bg-slate-100 text-sm text-slate-500 ${className}`}
    >
      Image coming soon
    </span>
  ) : (
    <span
      className={`bg-brand-900 text-brand-200 relative grid place-items-center overflow-hidden text-sm ${className}`}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,.7),transparent_28%),radial-gradient(circle_at_75%_70%,rgba(59,130,246,.65),transparent_30%)]" />
      <span className="bg-brand-900/70 relative z-10 rounded-lg border border-white/20 px-4 py-2 font-bold tracking-widest uppercase">
        LED display
      </span>
    </span>
  );
}

