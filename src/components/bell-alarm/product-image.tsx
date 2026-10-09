"use client";

import { useCallback, useState } from "react";
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
  const [failed, setFailed] = useState("");
  const measureImage = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image?.complete || !url) return;
      if (!image.naturalWidth) {
        setFailed(url);
        return;
      }
      // Contain large sources, but never upscale a small source beyond its pixels.
      image.style.maxWidth = `min(86%, ${image.naturalWidth}px)`;
      image.style.maxHeight = `min(86%, ${image.naturalHeight}px)`;
    },
    [url],
  );

  return (
    <div className={styles.frame} data-bell-product-image>
      {url && failed !== url ? (
        <img
          ref={measureImage}
          src={url}
          alt={name}
          width={240}
          height={240}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={styles.image}
          onLoad={(event) => measureImage(event.currentTarget)}
          onError={() => setFailed(url)}
        />
      ) : (
        <span className={styles.placeholder}>Image coming soon</span>
      )}
    </div>
  );
}
