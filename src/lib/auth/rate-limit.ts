import "server-only";

import type { NextRequest } from "next/server";

type RateLimitEntry = { count: number; resetAt: number };
const globalForRateLimit = globalThis as typeof globalThis & {
  authRateLimits?: Map<string, RateLimitEntry>;
};
const store =
  globalForRateLimit.authRateLimits ?? new Map<string, RateLimitEntry>();
globalForRateLimit.authRateLimits = store;

export function getRequestIdentifier(request: NextRequest) {
  // Forwarded headers are authoritative only when the deployment proxy is
  // configured to overwrite them. Set TRUST_PROXY_HEADERS=false otherwise.
  if (process.env.TRUST_PROXY_HEADERS === "false") return "unknown";
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (entry.count >= limit)
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
}
