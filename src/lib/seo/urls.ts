/** One canonical origin. Deployment redirects remain a deployment concern. */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL must be configured in production.");
  }
  const url = new URL(configured || "http://localhost:3000");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL must be an absolute HTTP(S) origin without credentials, path, query or fragment.",
    );
  }
  return url.origin;
}
export function isSearchIndexingAllowed(): boolean {
  const flag = process.env.ALLOW_SEARCH_INDEXING;
  if (flag !== undefined && flag !== "") return flag === "true";
  return process.env.NODE_ENV === "production";
}
export function absoluteUrl(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value, `${getSiteUrl()}/`);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function buildCanonicalUrl(path: string, page?: number): string {
  // Accept local route paths only: never let entity data replace the origin.
  const pathname = ("/" + path.split(/[?#]/)[0].replace(/^\/+/, ""))
    .replace(/\/{2,}/g, "/")
    .replace(/\/$/, "");
  return (
    getSiteUrl() +
    pathname +
    (page && Number.isSafeInteger(page) && page > 1 ? `?page=${page}` : "")
  );
}
