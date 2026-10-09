# Module 21 — Security & Validation

This document records the application security model and the hardening completed for Modules 1–20. It is an operational guide, not a guarantee that the application is unhackable; deployment configuration, provider controls, and ongoing review still matter.

## Authentication and authorization

Admin sessions use signed, expiring HS256 JWTs in an HTTP-only cookie. The cookie is `Secure` in production, `SameSite=Lax`, scoped to `/`, and is cleared on logout. `AUTH_SECRET` must be a unique value of at least 32 characters; weak placeholders are rejected. Password hashes are excluded by default and are only selected for server-side comparison. Login, forgot-password, and reset-password flows are rate limited and return generic responses to avoid account enumeration. Reset tokens are random, hashed before storage, time limited, and consumed atomically; resetting a password increments the session version and invalidates older sessions.

All admin reads and writes perform server-side authentication and role checks. Client visibility or disabled controls are never treated as authorization. Public DTOs omit admin notes, credentials, provider responses, and customer-only data.

## API validation and privacy

Mutation routes parse bounded JSON through the shared sales body reader and validate with Zod. Server code allowlists writable fields and recalculates order, quotation, and payment totals. IDs, enums, quantities, prices, pagination, URLs, and text lengths are validated. Search terms are escaped before regex construction and page sizes are capped. Public reference numbers are human-readable identifiers only; private order, quotation, enquiry, and payment records require their secure token or authenticated admin session.

React escaping remains the default for user content. JSON-LD is serialized safely. Video embeds are limited to normalized YouTube/Vimeo URLs; arbitrary iframe HTML and arbitrary server-side URL fetching are not accepted. Public portfolio and testimonial output respects publication, consent, and hidden-customer-name flags.

## Payments and webhooks

Paystack initialization and verification run server-side. Amount, currency, reference, and order association are checked against database state. Callback verification cannot mark an order paid by itself. Webhooks verify the exact raw-body HMAC with a timing-safe comparison, reject oversized bodies and invalid signatures, and return a retryable server error when valid events cannot be processed. Payment and inventory updates are guarded for idempotency and inventory deduction is performed at most once.

## Request forgery, redirects, and rate limits

Authentication cookies use `SameSite=Lax`; sensitive mutation endpoints remain same-origin application APIs. Webhooks use provider signatures rather than CSRF checks. Redirect destinations must be application-controlled paths. Login and public request/payment endpoints have in-memory rate limits. This limiter is process-local and must be replaced or externalized for multi-instance/serverless production if abuse volume requires it. When deployed behind a proxy, configure `TRUST_PROXY_HEADERS` only when that proxy overwrites forwarded headers; set it to `false` otherwise.

## Headers and caching

Production responses send CSP, `X-Content-Type-Options: nosniff`, a strict referrer policy, restrictive permissions policy, and frame protection. HSTS is emitted only when the configured production URL is HTTPS. Admin, customer, token, and payment responses use private/no-store cache headers. `robots.txt` and `noindex` are discoverability controls only and are not access control.

## Secrets and infrastructure

Keep MongoDB, `AUTH_SECRET`, Paystack secret keys, email credentials, and `CRON_SECRET` server-only. `.env.example` contains placeholders only; never commit `.env.local`. The reminder endpoint requires a strong `CRON_SECRET` in an Authorization bearer header and compares it in constant time. Use a least-privilege MongoDB Atlas user, TLS, restricted Network Access rules, backups, and rotated credentials.

## Production checklist

- [ ] Generate a unique production `AUTH_SECRET` (32+ characters).
- [ ] Rotate development/test credentials and change the admin password.
- [ ] Secure MongoDB credentials and review Atlas Network Access/backups.
- [ ] Configure Paystack live keys and webhook URL; keep the secret key server-only.
- [ ] Configure email credentials and `CRON_SECRET` securely.
- [ ] Confirm `.env.local` is not tracked and production sets `ALLOW_SEARCH_INDEXING` deliberately.
- [ ] Enable HTTPS and verify CSP, HSTS, and private cache behavior.
- [ ] Review proxy handling for `TRUST_PROXY_HEADERS` and replace process-local rate limiting when scaling.
- [ ] Review logs and provider dashboards for sensitive data and duplicate payment events.

## Known limitations and follow-up

`npm audit` requires registry access and could not be completed in the restricted environment; run it in CI or a networked workstation and review upgrades without `--force`. Multi-instance rate-limit storage, deployment redirects, Atlas network policy, backups, and runtime monitoring remain deployment responsibilities. Search engines decide crawl, indexing, and ranking behavior; SEO and security controls do not guarantee ranking.
