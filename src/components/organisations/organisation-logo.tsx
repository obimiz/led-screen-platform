"use client";
import { useCallback, useState } from "react";
export function OrganisationLogo({
  name,
  url,
}: {
  name: string;
  url: string | null;
}) {
  const [failed, setFailed] = useState("");
  const [wideUrl, setWideUrl] = useState("");
  const measureLogo = useCallback(
    (image: HTMLImageElement | null) => {
      if (image?.complete && url) {
        if (image.naturalWidth === 0) setFailed(url);
        else setWideUrl(image.naturalWidth / image.naturalHeight >= 2 ? url : "");
      }
    },
    [url],
  );
  return (
    <div
      className={`organisation-logo ${url && wideUrl === url ? "organisation-logo-wide" : ""}`}
    >
      {url && failed !== url ? (
        <img
          src={url}
          alt={`${name} logo`}
          loading="eager"
          decoding="async"
          width={110}
          height={80}
          ref={measureLogo}
          onLoad={(event) => measureLogo(event.currentTarget)}
          onError={() => setFailed(url)}
        />
      ) : (
        <span aria-hidden="true" className="text-brand-700 text-2xl font-bold">
          {name
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase()}
        </span>
      )}
    </div>
  );
}
