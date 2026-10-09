"use client";
import { useCallback, useState } from "react";
export function ProductImage({
  url,
  name,
  className = "aspect-video",
  priority = false,
  fit = "cover",
  neutralFallback = false,
}: {
  url: string;
  name: string;
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  neutralFallback?: boolean;
}) {
  const [failed, setFailed] = useState("");
  const checkImage = useCallback(
    (image: HTMLImageElement | null) => {
      if (image?.complete && !image.naturalWidth && url) setFailed(url);
    },
    [url],
  );
  return url && failed !== url ? (
    <span
      className={`relative block overflow-hidden bg-slate-100 ${className}`}
    >
      <img
        ref={checkImage}
        src={url}
        onError={() => setFailed(url)}
        alt={name}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        width={960}
        height={600}
        style={{ objectFit: fit, objectPosition: "center" }}
        className={`absolute inset-0 h-full w-full ${fit === "contain" ? "p-4" : ""}`}
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
