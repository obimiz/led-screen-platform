import { z } from "zod";
export function normalizeMusicSourceUrl(value: string) {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (
      (host === "youtube-nocookie.com" || host === "youtube.com") &&
      /^\/embed\/[\w-]+$/.test(u.pathname)
    )
      return `https://www.youtube-nocookie.com${u.pathname}`;
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      return id
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`
        : null;
    }
    if (host === "youtu.be")
      return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(u.pathname.slice(1))}`;
    if (host === "open.spotify.com") {
      const p = u.pathname
        .split("/")
        .filter(Boolean)
        .filter((part) => part !== "embed");
      return p.length >= 2
        ? `https://open.spotify.com/embed/${p[0]}/${p[1]}`
        : null;
    }
    return null;
  } catch {
    return null;
  }
}
export const safeExternalUrl = z
  .string()
  .url()
  .refine((v) => {
    try {
      return ["http:", "https:"].includes(new URL(v).protocol);
    } catch {
      return false;
    }
  }, "Use a valid web URL");
