"use client";
import Image from "next/image";
import { useCallback, useState } from "react";
import { normalizePublicImageUrl } from "@/lib/media/product-primary-image";

export function OrganisationLogo({
  name,
  url,
}: {
  name: string;
  url: string | null;
}) {
  const normalizedUrl = normalizePublicImageUrl(url);
  const [failed, setFailed] = useState("");
  const [wideUrl, setWideUrl] = useState("");
  const measureLogo = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image || !normalizedUrl) return;
      if (!image.complete) {
        image.addEventListener("error", () => setFailed(normalizedUrl), {
          once: true,
        });
        return;
      }
      if (image.naturalWidth === 0) setFailed(normalizedUrl);
      else
        setWideUrl(
          image.naturalWidth / image.naturalHeight >= 2 ? normalizedUrl : "",
        );
    },
    [normalizedUrl],
  );
  const unoptimized =
    !normalizedUrl.startsWith("/") ||
    normalizedUrl.toLowerCase().endsWith(".svg");

  return (
    <div
      className={`organisation-logo ${normalizedUrl && wideUrl === normalizedUrl ? "organisation-logo-wide" : ""}`}
    >
      {normalizedUrl && failed !== normalizedUrl ? (
        <Image
          src={normalizedUrl}
          overrideSrc={normalizedUrl}
          alt={`${name} logo`}
          loading="eager"
          decoding="async"
          width={110}
          height={80}
          sizes="110px"
          unoptimized={unoptimized}
          ref={measureLogo}
          onLoad={(event) => measureLogo(event.currentTarget)}
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

