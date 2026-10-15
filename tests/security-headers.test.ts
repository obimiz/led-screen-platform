import assert from "node:assert/strict";
import test from "node:test";
import nextConfig from "../next.config";

test("only development permits eval; production keeps the existing CSP and HTTPS headers", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  try {
    const policies = new Map<string, string>();
    for (const mode of ["development", "production", "test"]) {
      Object.assign(process.env, {
        NODE_ENV: mode,
        NEXT_PUBLIC_APP_URL: "https://example.test",
      });
      assert.equal(typeof nextConfig.headers, "function");
      const routes = await nextConfig.headers!();
      const headers = routes.find((r) => r.source === "/(.*)")!.headers;
      const csp = headers.find(
        (h) => h.key === "Content-Security-Policy",
      )!.value;
      policies.set(mode, csp);
      assert.equal(csp.includes("'unsafe-eval'"), mode === "development");
      assert.ok(csp.includes("object-src 'none'"));
      assert.ok(csp.includes("frame-ancestors 'self'"));
      assert.ok(csp.includes("img-src 'self' data: blob: https:"));
      assert.equal(
        csp.includes("upgrade-insecure-requests"),
        mode === "production",
      );
      assert.equal(
        headers.some((h) => h.key === "Strict-Transport-Security"),
        mode === "production",
      );
    }
    assert.equal(
      policies.get("development")!.replace(" 'unsafe-eval'", ""),
      policies.get("test"),
    );
    assert.equal(
      policies.get("production")!.replace("; upgrade-insecure-requests", ""),
      policies.get("test"),
    );
  } finally {
    if (originalNodeEnv === undefined)
      Reflect.deleteProperty(process.env, "NODE_ENV");
    else Object.assign(process.env, { NODE_ENV: originalNodeEnv });
    if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  }
});
