"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { normalizePublicImageUrl } from "@/lib/media/product-primary-image";
import styles from "./product-image.module.css";

export function BellAlarmProductImage({
  url,
  name,
  priority = false,
}: {
  url?: string | null;
  name: string;
  priority?: boolean;
}) {
  const normalizedUrl = normalizePublicImageUrl(url);
  const [failed, setFailed] = useState("");
  const measureImage = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image || !normalizedUrl) return;
      if (!image.complete) {
        image.addEventListener("error", () => setFailed(normalizedUrl), {
          once: true,
        });
        return;
      }
      if (!image.naturalWidth) {
        setFailed(normalizedUrl);
        return;
      }
      // Contain large sources, but never upscale a small source beyond its pixels.
      image.style.maxWidth = `min(86%, ${image.naturalWidth}px)`;
      image.style.maxHeight = `min(86%, ${image.naturalHeight}px)`;
    },
    [normalizedUrl],
  );
  const unoptimized =
    !normalizedUrl.startsWith("/") ||
    normalizedUrl.toLowerCase().endsWith(".svg");

  return (
    <div className={styles.frame} data-bell-product-image>
      {normalizedUrl && failed !== normalizedUrl ? (
        <Image
          ref={measureImage}
          src={normalizedUrl}
          overrideSrc={normalizedUrl}
          alt={name}
          width={240}
          height={240}
          sizes="(max-width: 768px) 86vw, 340px"
          preload={priority}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          unoptimized={unoptimized}
          className={styles.image}
          onLoad={(event) => measureImage(event.currentTarget)}
        />
      ) : (
        <span className={styles.placeholder}>Image coming soon</span>
      )}
    </div>
  );
}

