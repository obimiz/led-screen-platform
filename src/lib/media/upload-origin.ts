/** Reverse proxies terminate TLS before forwarding requests to Next.js. */
export function isSameOriginUpload(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const url = new URL(request.url);
  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
    url.protocol.slice(0, -1);
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0].trim() ||
    request.headers.get("host") ||
    url.host;
  return (
    ["http", "https"].includes(protocol) && origin === `${protocol}://${host}`
  );
}
