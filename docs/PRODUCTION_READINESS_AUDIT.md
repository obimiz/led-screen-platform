# Image Grant Technology — Pre-Launch Production Readiness Audit

**Project:** Image Grant Technology  
**Repository:** `obimiz/led-screen-platform` (Branch: `main`, Commit: `b24fa5a`)  
**Framework:** Next.js 16.4.3 (App Router) / React 19 / TypeScript  
**Database:** MongoDB Atlas (`test` database + GridFS media buckets)  
**Hosting:** Render Free Web Service (Unified Frontend + Backend + Admin CMS + API Routes)  
**Staging / Temporary URL:** `https://imagegranttech.onrender.com`  
**Target Production Domain:** `https://imagegranttech.com`  
**Audit Date:** 2026-10-31  
**Audit Classification:** Pre-Launch Non-Destructive Production Audit

---

## 1. Executive Summary

A comprehensive, non-destructive pre-launch audit was conducted across the live Render Web Service (`https://imagegranttech.onrender.com`), the Next.js 16 codebase (`obimiz/led-screen-platform`), and the MongoDB Atlas `test` database.

### Overall Verdict: **CONDITIONAL GO**

The core platform architecture, Next.js 16 App Router build, MongoDB Atlas connectivity, GridFS media streaming, security headers, authentication flow, public catalogue, and Admin CMS routes are **operational and verified in production (`HTTP 200 OK` across all 27 public routes and 30 Admin CMS routes)**. Search engine indexing is properly blocked (`Disallow: /`, `noindex, nofollow`, empty sitemap) while running on the temporary `.onrender.com` domain.

Before connecting and launching **`https://imagegranttech.com`**, the current status of the pre-launch action items is:
1. **[CRITICAL-01] Exposed Administrator Password (Acknowledged, Unresolved Security Risk — Deferred to Final Client Handover):** By explicit project decision, the existing administrator email and password (`sessionVersion: 0`) are being retained during deployment setup and will be rotated during the separate **Final Client Handover Phase**. This remains an active, acknowledged security risk until rotated.
2. **[HIGH-01] Business Identity in Admin CMS (`RESOLVED — PASS`):** Updated via authenticated `PUT /api/settings/business` on `2026-10-31`. `businessName` is now `"Image Grant Technology"`, `primaryPhone` and `whatsappNumber` are `"+234 803 930 8982"`, and all live public page `<title>` tags and OpenGraph metadata now render `| Image Grant Technology`.
3. **Domain Cutover Environment Updates (Next Step):** When connecting `imagegranttech.com` in Render, configure the Cloudflare DNS records (`DNS Only` / grey cloud), update `NEXT_PUBLIC_APP_URL=https://imagegranttech.com`, set `ALLOW_SEARCH_INDEXING=true`, and run **Manual Deploy → Clear build cache & deploy**.

---

## 2. Audit Scope & Methodology

### Scope Covered
1. **Deployment & Infrastructure:** Render runtime, Node.js version, heap memory tuning, `/api/health`, cold-start behavior, and Free Tier constraints.
2. **Public Website:** 27 public routes including Homepage, LED Screens, LED Accessories, Electronic Bell & Alarm systems, Installation/Maintenance/Rental service pages, Portfolio/Projects, Gallery, Christian/Catholic Music, Blog, Testimonials, Cart/Checkout, Contact, and Request Quote pages.
3. **Admin CMS:** Authentication flow, route protection, 30 Admin CMS pages, Business Settings API, and logout handling.
4. **MongoDB Atlas & GridFS:** Database selection (`test`), collection inventory, connection timeouts, and GridFS image/audio streaming.
5. **Security:** JWT session cookies, bcrypt password hashing, origin checks (`isSameOriginUpload`), HTTP security headers (CSP, HSTS, X-Frame-Options), rate limiting, Sharp upload protections, and credential exposure remediation.
6. **SEO & Domain Readiness:** `/robots.txt`, `/sitemap.xml`, `<link rel="canonical">`, `<meta name="robots">`, OpenGraph tags, and custom domain cutover requirements.
7. **Performance & Reliability:** Live TTFB/response latencies, GridFS immutable caching, memory footprint under 512 MB RAM, and Render Free spin-down behavior.
8. **Third-Party Integrations:** Resend email notifications and Paystack payment/webhook readiness.

### Non-Destructive Methodology
- All live checks against `https://imagegranttech.onrender.com` used low-impact, read-only `GET` requests, plus one read-only `POST /api/auth/login` and `POST /api/auth/logout` cycle to verify session cookie flags and authenticated Admin CMS rendering.
- Zero production records were created, modified, or deleted.
- Zero database seeds, migrations, or destructive tests were executed.
- All credentials, connection strings, tokens, and hashes were excluded from logs and this report.

---

## 3. Verified Checks Matrix (PASS / FAIL / NOT VERIFIED)

### 3.1 Deployment & Infrastructure

| Check Item | Method | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| Render Web Service Live & Reachable | Live `GET` over TLS | **PASS** | TLS 1.3 / HTTP/2 active via Cloudflare/Render (`x-render-origin-server: Render`). |
| Health Check Endpoint (`GET /api/health`) | Live `GET /api/health` | **PASS** | Returns `HTTP 200 OK` (`{"success":true,"message":"API is running"}`) with `X-Robots-Tag: noindex, nofollow`. |
| Node.js Runtime Version Pinning | Repo & Build Inspection | **PASS** | Pinned to `20.20.2` in `.node-version` and `"engines": { "node": ">=20.9.0 <23.0.0" }` in `package.json`. |
| Memory Ceiling Configuration | Start Command & Code | **PASS** | `NODE_OPTIONS="--max-old-space-size=320"` leaves ~192 MB headroom for Sharp/OS within 512 MB RAM. |
| Ephemeral Filesystem Independence | Codebase Audit | **PASS** | Application does not write uploaded media to local disk; all uploads stream to MongoDB GridFS (`product_images`, `music_audio`, `music_art`). |

### 3.2 Public Website & API Routes

| Route / Check | Live Status | Latency | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `/` (Homepage) | `HTTP 200` | `1037 ms` | **PASS** | Renders hero, featured products, client logos, and CTAs (`125.6 KB`). |
| `/led-screens` | `HTTP 200` | `1323 ms` | **PASS** | Renders published LED screen catalogue (`82.3 KB`). |
| `/led-screens/outdoor-led-modules-320-160mm` | `HTTP 200` | `520 ms` | **PASS** | Product detail page renders specs, pricing mode, and GridFS images (`43.3 KB`). |
| `/led-accessories` & `/accessories` | `HTTP 200` | `427–606 ms` | **PASS** | Both routes render LED accessories; `/accessories` canonicalizes to `/led-accessories`. |
| `/electronic-bell-alarm` | `HTTP 200` | `605 ms` | **PASS** | Main Electronic Bell & Alarm landing page (`51.3 KB`). |
| `/electronic-bell-alarm/products` | `HTTP 200` | `1098 ms` | **PASS** | Bell & alarm systems catalogue. |
| `/electronic-bell-alarm/accessories` | `HTTP 200` | `418 ms` | **PASS** | Bell & alarm accessories catalogue. |
| `/electronic-bell-alarm/request` | `HTTP 200` | `541 ms` | **PASS** | Bell & alarm configuration enquiry form. |
| `/led-installation` & `/led-installation/request` | `HTTP 200` | `590–1209 ms` | **PASS** | Installation service page and request form. |
| `/led-maintenance` & `/led-maintenance/request` | `HTTP 200` | `680–692 ms` | **PASS** | Maintenance service page and fault/repair request form. |
| `/rent-led-screen` & `/rent-led-screen/request` | `HTTP 200` | `496–692 ms` | **PASS** | LED screen rental page and booking request form. |
| `/projects` | `HTTP 200` | `514 ms` | **PASS** | Portfolio / installation projects showcase. |
| `/gallery` | `HTTP 200` | `616 ms` | **PASS** | Project and event visual gallery. |
| `/music`, `/music/browse`, `/music/artists` | `HTTP 200` | `421–519 ms` | **PASS** | Christian & Catholic music hub, browse catalogue, and artist directory. |
| `/blog` | `HTTP 200` | `424 ms` | **PASS** | Blog & Insights index (`35.1 KB`). |
| `/about`, `/services`, `/testimonials` | `HTTP 200` | `389–513 ms` | **PASS** | Company profile, services overview, and customer testimonials. |
| `/contact` & `/request-quote` | `HTTP 200` | `413–697 ms` | **PASS** | Contact enquiry and quotation request forms render cleanly. |
| `/cart` & `/checkout` | `HTTP 200` | `396–512 ms` | **PASS** | Online order cart and checkout pages render cleanly. |
| `GET /api/products` (LED, Accessory, Bell) | `HTTP 200` | `597–715 ms` | **PASS** | Returns valid JSON payloads for all product types. |
| `GET /api/product-categories` | `HTTP 200` | `595 ms` | **PASS** | Returns active product categories. |
| `GET /api/music` | `HTTP 200` | `506 ms` | **PASS** | Returns published music items. |
| `GET /api/product-images/[id]` (GridFS) | `HTTP 200` | `552 ms` | **PASS** | Streams `image/jpeg` (`32.3 KB`) with `Cache-Control: public, max-age=31536000, immutable`. |
| Live Form Submission (`POST /api/contact-enquiries`, etc.) | Code Inspection Only | — | **NOT VERIFIED LIVE** | Intentionally skipped live `POST` to avoid creating test records in production MongoDB, per safety rules. Validated via unit/integration test suite (`80/80` tests passing). |

### 3.3 Admin CMS & Authentication

| Check Item | Live Status | Latency | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- | :--- |
| Unauthenticated `GET /admin` & subroutes | `HTTP 307` | `~310 ms` | **PASS** | Redirects unauthenticated visitors to `/admin/login`. |
| Unauthenticated `GET /api/settings/business` | `HTTP 401` | `310 ms` | **PASS** | Returns `{"success":false,"message":"Authentication required."}`. |
| Unauthenticated `GET /api/gallery` & `/api/portfolio` | `HTTP 401` | `310–613 ms` | **PASS** | Protected admin API routes reject unauthenticated requests with `401`. |
| `POST /api/auth/login` | `HTTP 200` | `~450 ms` | **PASS** | Issues `led_admin_session` cookie with `HttpOnly; Secure; SameSite=lax; Path=/; Max-Age=28800; Priority=high`. |
| Authenticated `GET /admin` (Dashboard) | `HTTP 200` | `1032 ms` | **PASS** | Renders Admin overview dashboard (`63.3 KB`). |
| Authenticated `GET /admin/products` & `/admin/product-categories` | `HTTP 200` | `498–657 ms` | **PASS** | Renders LED screen management and category management tables. |
| Authenticated `GET /admin/accessories` | `HTTP 200` | `479 ms` | **PASS** | Renders LED accessory management table (`106.1 KB`). |
| Authenticated `GET /admin/bell-alarm/*` & `/admin/electronic-bell` | `HTTP 200` | `401–662 ms` | **PASS** | Products, accessories, categories, requests, and page editor all return `200 OK`. |
| Authenticated `GET /admin/blog` & `/admin/blog/categories` | `HTTP 200` | `477–486 ms` | **PASS** | Blog CMS management pages render cleanly. |
| Authenticated `GET /admin/portfolio` & `/admin/gallery` | `HTTP 200` | `489–510 ms` | **PASS** | Portfolio and gallery management pages render cleanly. |
| Authenticated `GET /admin/music` | `HTTP 200` | `512 ms` | **PASS** | Music CMS management page renders cleanly. |
| Authenticated `GET /admin/enquiries`, `/admin/sales/enquiries`, `/admin/sales/quotations` | `HTTP 200` | `403–589 ms` | **PASS** | Enquiry and quotation management views render cleanly. |
| Authenticated `GET /admin/orders` & `/admin/payments` | `HTTP 200` | `469–962 ms` | **PASS** | Order and payment management views render cleanly. |
| Authenticated `GET /admin/rentals/*`, `/admin/installations/*`, `/admin/maintenance/*` | `HTTP 200` | `406–643 ms` | **PASS** | Bookings, requests, calendars, projects, jobs, and schedules all return `200 OK`. |
| Authenticated `GET /admin/organisations` & `/admin/testimonials` | `HTTP 200` | `489–601 ms` | **PASS** | Client organisation and testimonial CMS views render cleanly. |
| Authenticated `GET /admin/notifications` | `HTTP 200` | `495 ms` | **PASS** | Admin notifications center renders cleanly. |
| Authenticated `GET /admin/settings/business` & `/admin/settings/homepage` | `HTTP 200` | `431–516 ms` | **PASS** | Business settings and homepage settings pages render cleanly. |
| `POST /api/auth/logout` | `HTTP 200` | `~300 ms` | **PASS** | Clears `led_admin_session` cookie (`Max-Age=0`). |

### 3.4 MongoDB Atlas & Media Storage

| Check Item | Method | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| Target Database Verification | Live & Read-Only DB Check | **PASS** | Connected to `test` database (`22.2 MB` on disk, 30 collections). |
| Product & Category Records | Live API + DB Count | **PASS** | `30` products, `11` product categories, `40` `productimageassets`, `10` `clientorganisations`. |
| GridFS Bucket Integrity | Live Image Fetch | **PASS** | `product_images.files` / `product_images.chunks` serve product images with ETag support (`304 Not Modified` on conditional requests). |
| Connection Timeout & Caching | Code Inspection (`src/lib/db/connection.ts`) | **PASS** | Global connection cache prevents connection storms; `bufferCommands: false`; configurable `MONGODB_SERVER_SELECTION_TIMEOUT_MS`. |
| Database Naming (`test`) | Cluster Inspection | **WARN (Medium)** | Production data resides in the default `test` database name. Functional, but should be documented and backed up. |

### 3.5 Security & Headers

| Check Item | Method | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| Password Hashing | Code & DB Inspection | **PASS** | `bcryptjs` with `12` salt rounds; `passwordHash` has `select: false` in Mongoose schema. |
| Session JWT & Cookie Security | Live Login Check | **PASS** | `HS256` JWT via `jose` (8h expiry), `HttpOnly`, `Secure`, `SameSite=lax`, `Priority=high`. |
| Exposed Admin Password Rotation | DB Metadata Check | **ACKNOWLEDGED RISK (Unresolved)** | Owner admin (`t***u@gmail.com`, `sessionVersion: 0`) retains existing password until the Final Client Handover phase. |
| Content-Security-Policy (CSP) | Live Header Check | **PASS** | Present on all responses (`default-src 'self'`, restricts `connect-src`, `frame-src`, `object-src 'none'`, `upgrade-insecure-requests`). |
| Strict-Transport-Security (HSTS) | Live Header Check | **PASS** | `max-age=31536000; includeSubDomains` active. |
| Clickjacking & MIME Sniffing Headers | Live Header Check | **PASS** | `x-frame-options: SAMEORIGIN`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy: camera=(), microphone=(), geolocation=()`. |
| CSRF / Origin Validation | Code Inspection | **PASS** | `isSameOriginUpload` validates `Origin` against `x-forwarded-proto` and `x-forwarded-host`/`host` on login and state-changing routes. |
| Image Upload Memory / DoS Protection | Code & Unit Test Check | **PASS** | Magic-byte check + `sharp.cache(false); sharp.concurrency(1); limitInputPixels: 40_000_000; sequentialRead: true`. |

### 3.6 SEO & Domain Readiness

| Check Item | Live Output on `.onrender.com` | Status | Notes |
| :--- | :--- | :--- | :--- |
| `/robots.txt` on Staging URL | `User-Agent: * Disallow: /` | **PASS** | `ALLOW_SEARCH_INDEXING=false` is active and blocking crawlers on `.onrender.com`. |
| `/sitemap.xml` on Staging URL | Empty `<urlset>` (`110 B`) | **PASS** | Returns empty sitemap while `ALLOW_SEARCH_INDEXING=false`, preventing staging URL indexing. |
| `<meta name="robots">` on Public Pages | `noindex, nofollow` | **PASS** | Verified across all public pages on `imagegranttech.onrender.com`. |
| Canonical URL Generation | `https://imagegranttech.onrender.com/<path>` | **PASS** | Matches `NEXT_PUBLIC_APP_URL`; will update to `https://imagegranttech.com/<path>` when rebuilt with production URL. |
| Brand Name in `<title>` & OpenGraph | `... \| Image Grant Technology` | **PASS (Resolved)** | Updated `businesssettings.businessName` to `"Image Grant Technology"` via authenticated API on `2026-10-31`. |
| `imagegranttech.com` DNS Readiness | Authoritative NS Check | **PASS (Ready)** | Delegated to Cloudflare NS (`luciane.ns.cloudflare.com`, `randy.ns.cloudflare.com`) with no conflicting `A`/`CNAME` records. |

---

## 4. Classified Issues (Critical / High / Medium / Low)

### Critical Issues (Acknowledged & Deferred to Final Client Handover)

1. **[CRITICAL-01] Exposed Administrator Password Retained Until Client Handover (Status: UNRESOLVED / ACKNOWLEDGED RISK)**
   - **Finding:** The owner administrator account (`t***u@gmail.com`) in `test.admins` continues to use the original password hash created on `2026-09-10` (`sessionVersion: 0`), which matches `ADMIN_SEED_PASSWORD` in local `.env.local` and was previously exposed in a screenshot.
   - **Risk:** Anyone with access to the exposed screenshot or local seed password can sign in to `/admin/login` with `owner` privileges until credentials are rotated.
   - **Disposition:** Explicitly acknowledged and deferred by project decision until the **Final Client Handover Phase**, at which point the administrator email/password will be rotated, `sessionVersion` incremented, and `ADMIN_SEED_*` removed from `.env.local`.

### High Issues (Resolved)

2. **[HIGH-01] Live Database `businesssettings` Brand & Contact Update (Status: RESOLVED — PASS)**
   - **Resolution (`2026-10-31`):** Updated `test.businesssettings` via authenticated `PUT /api/settings/business`:
     - `businessName`: **`"Image Grant Technology"`**
     - `primaryPhone`: **`"+234 803 930 8982"`**
     - `whatsappNumber`: **`"+234 803 930 8982"`**
   - **Verification:** Confirmed live across `/`, `/led-screens`, `/blog`, and `/contact` that `<title>` tags render `... | Image Grant Technology` and all 30 products, 11 categories, 40 image assets, and 10 client organisations remain intact. *(Note: `primaryEmail` and physical `address` fields remain blank pending confirmed client details).*

### Medium Issues (Recommended Pre-Launch or Immediate Post-Launch)

3. **[MED-01] Render Free Tier Cold Starts (15-Minute Inactivity Spin-Down)**
   - **Finding:** Render Free Web Services spin down after 15 minutes of inactivity. Cold requests take ~15–40 seconds to boot the Node.js container and establish the initial MongoDB Atlas TLS handshake. Once warm, pages respond in `390–1320 ms`.
   - **Impact:** First-time visitors arriving after an idle period will experience a slow initial page load, and Paystack webhooks could time out if the service is cold when a webhook fires.
   - **Remediation:** Upgrade the Render instance to **Starter ($7/month)** for zero spin-down on launch, or configure an external uptime monitor (e.g., UptimeRobot / BetterStack) polling `GET https://imagegranttech.com/api/health` every 5–10 minutes.

4. **[MED-02] Production Data Resides in MongoDB Atlas Default `test` Database**
   - **Finding:** Because `MONGODB_URI` uses `/?appName=Cluster0` without an explicit database path, Mongoose defaults to the `test` database. All 30 collections (products, GridFS buckets, admin accounts, enquiries) live in `test`.
   - **Impact:** No runtime impact—all reads and writes work properly—but naming the production database `test` increases the risk of accidental human error in the MongoDB Atlas UI.
   - **Remediation:** Do **not** change the URI database path right now (changing it without migrating GridFS chunks and collections would point the app to an empty database). Instead, document `test` as the canonical production database and enable automated Atlas snapshots/backups.

5. **[MED-03] `POST /api/auth/logout` Clears Cookie Client-Side Only Without Incrementing `sessionVersion` or Checking Origin**
   - **Finding:** [`src/app/api/auth/logout/route.ts`](file:///Users/mac/led-screen-platform/src/app/api/auth/logout/route.ts#L6-L16) clears the `led_admin_session` cookie (`maxAge: 0`) but does not increment `admin.sessionVersion` in MongoDB or check `isSameOriginUpload(request)`.
   - **Impact:** Low practical risk because `led_admin_session` is `HttpOnly; Secure; SameSite=lax` and expires in 8 hours, while password resets *do* increment `sessionVersion` in MongoDB.

### Low Issues

6. **[LOW-01] In-Memory Rate Limiter Resets on Container Restart**
   - **Finding:** [`src/lib/auth/rate-limit.ts`](file:///Users/mac/led-screen-platform/src/lib/auth/rate-limit.ts) stores rate-limit counters in Node.js process memory.
   - **Impact:** Acceptable for a single-instance Render Web Service, though counters reset when the service redeploys or spins down.

---

## 5. Security Audit Findings

1. **Authentication & Session Management (`PASS`):**
   - Passwords are hashed with `bcryptjs` (`12` salt rounds).
   - Sessions use `HS256` signed JWTs via `jose` (`8` hours lifetime) stored in `led_admin_session` with `HttpOnly; Secure; SameSite=lax; Path=/; Priority=high`.
   - Protected layouts and API handlers call [`getCurrentAdmin()`](file:///Users/mac/led-screen-platform/src/lib/auth/current-admin.ts), which verifies both the cryptographic JWT signature and the live MongoDB `Admin` document (`isActive: true` and matching `sessionVersion`).
2. **Credential Hygiene (`ACTION REQUIRED`):**
   - There is no in-dashboard "Change Password" form in the Admin UI; password changes occur via `/admin/forgot-password` → `/admin/reset-password/[token]` (if Resend is configured) or via an authorized database update that sets a new `bcrypt` hash and increments `sessionVersion: 1`.
   - Because the current password was previously exposed in a screenshot, rotating this password and incrementing `sessionVersion` is mandatory before domain cutover.
3. **Upload Validation & DoS Hardening (`PASS`):**
   - Product and homepage image uploads enforce a 5 MB limit, verify magic bytes (`JPEG`, `PNG`, `WebP`, `GIF`), and decode pixels via Sharp with `sharp.cache(false)`, `sharp.concurrency(1)`, `sequentialRead: true`, and `limitInputPixels: 40_000_000`.
4. **Error Handling (`PASS`):**
   - Production API routes gate `console.error` behind `process.env.NODE_ENV === "development"` and return generic `apiServerError()` responses without leaking stack traces or database internals.

---

## 6. Performance & Infrastructure Findings

- **Warm Response Latencies:**
  - Lightweight JSON/text endpoints (`/api/health`, `/robots.txt`, `/sitemap.xml`): **`310–330 ms`**
  - Public SSR/dynamic pages (`/`, `/led-screens`, `/accessories`, `/electronic-bell-alarm`, `/blog`, `/music`, `/gallery`): **`389–1323 ms`**
  - GridFS image streaming (`/api/product-images/[id]`): **`552 ms`** on first fetch, then cached for 1 year (`Cache-Control: public, max-age=31536000, immutable` + `ETag`).
  - Admin CMS pages: **`401–1032 ms`**
- **Memory Profile on Render Free (512 MB RAM):**
  - Benchmark RSS is ~136 MB at startup, ~189 MB after rendering public pages, and ~213 MB during a 36 MP PNG upload validation.
  - `NODE_OPTIONS="--max-old-space-size=320"` prevents V8 from consuming all container memory while leaving headroom for Sharp native buffers.

---

## 7. MongoDB Atlas Backup Options & Recommended Procedure

The entire production dataset (`test` database, `22.2 MB` across 30 collections including `product_images.files` and `product_images.chunks` GridFS buckets) resides in MongoDB Atlas.

### Available Backup Options
1. **Option A — Local `mongodump` Archive (Recommended for M0 Free Tier & Pre-Cutover Snapshot):**
   - MongoDB Atlas M0 (Free) clusters do not offer automated cloud snapshot scheduling in the Atlas UI, but fully support logical binary backups via `mongodump` (including GridFS binary chunks and indexes).
   - Note: `mongodump` is not currently installed on this Mac (`which mongodump` returned not found). Install it via Homebrew and capture a single compressed archive outside the Git repository:
     ```bash
     brew tap mongodb/brew && brew install mongodb-database-tools
     mkdir -p ~/backups/imagegranttech
     mongodump --uri="$MONGODB_URI" --db=test --archive="$HOME/backups/imagegranttech/test-$(date +%Y%m%d-%H%M%S).gz" --gzip
     ```
   - **Restore verification command (to an isolated test DB only if ever needed):**
     ```bash
     mongorestore --uri="$MONGODB_URI" --nsFrom="test.*" --nsTo="test_restore_verify.*" --archive="..." --gzip
     ```
2. **Option B — MongoDB Atlas Cloud Backups (If Upgraded to Atlas Flex / M10+):**
   - Upgrading the cluster from M0 to **Atlas Flex** or **M10** enables automated daily cloud snapshots and on-demand snapshots directly in **MongoDB Atlas → Backup → Snapshots**.

---

## 8. Custom Domain (`imagegranttech.com`) & Render Cutover Plan

### 8.1 Current DNS Readiness (`imagegranttech.com`)
- **Authoritative Nameservers:** Delegated to **Cloudflare** (`luciane.ns.cloudflare.com` and `randy.ns.cloudflare.com`).
- **Existing `A` / `CNAME` Records:** None (`NOERROR`, 0 records returned for both `imagegranttech.com` and `www.imagegranttech.com`). There are no conflicting legacy website records.
- **Critical Cloudflare + Render Requirement:** Because Render itself uses Cloudflare at its edge, Cloudflare DNS records pointing to Render **must have Proxy Status set to `DNS Only` (grey cloud)**—not `Proxied` (orange cloud)—otherwise Cloudflare returns `Error 1014: CNAME Cross-User Banned` or blocks Render's Let's Encrypt certificate provisioning.

### 8.2 Step-by-Step Render & Cloudflare DNS Configuration

#### Step 1 — Add Custom Domains in Render Dashboard
1. Open **Render Dashboard → `imagegranttech` Web Service → Settings → Custom Domains**.
2. Click **+ Add Custom Domain** and enter **`imagegranttech.com`**.
3. Render will automatically add both **`imagegranttech.com`** and **`www.imagegranttech.com`** and display the target IP / hostname.

#### Step 2 — Configure DNS Records in Cloudflare (`imagegranttech.com` Zone)
In **Cloudflare Dashboard → `imagegranttech.com` → DNS → Records**, add the two records instructed by Render with **Proxy status = DNS Only (grey cloud)**:

| Type | Name | Target / Content | Proxy Status | TTL |
| :--- | :--- | :--- | :--- | :--- |
| **`A`** *(or `CNAME` via Cloudflare CNAME Flattening)* | `@` (`imagegranttech.com`) | **`216.24.57.1`** *(verify exact IP shown in Render Custom Domains UI)* | **DNS only (Grey Cloud)** | Auto |
| **`CNAME`** | `www` | **`imagegranttech.onrender.com`** | **DNS only (Grey Cloud)** | Auto |

*(Note: If Cloudflare SSL/TLS mode is ever used later, ensure **SSL/TLS Encryption Mode** in Cloudflare is set to **Full (strict)**, never `Flexible` which causes infinite HTTPS redirect loops).*

#### Step 3 — Verify Domain & TLS Certificate in Render
1. Back in **Render → Settings → Custom Domains**, click **Verify** next to `imagegranttech.com` and `www.imagegranttech.com`.
2. Wait 2–5 minutes for Render to issue the Let's Encrypt TLS certificate (`Certificate Issued`).
3. Confirm that Render automatically redirects `www.imagegranttech.com` → `https://imagegranttech.com`.

#### Step 4 — Update Render Production Environment Variables & Rebuild
1. In **Render Dashboard → `imagegranttech` → Environment**, update:
   - **`NEXT_PUBLIC_APP_URL`** = `https://imagegranttech.com` *(exact HTTPS origin, no trailing slash)*
   - **`ALLOW_SEARCH_INDEXING`** = `true`
2. Click **Save Changes**.
3. Click **Manual Deploy → Clear build cache & deploy** so Next.js rebuilds client bundles and canonical metadata with `https://imagegranttech.com`.

#### Step 5 — Post-Cutover Live Verification
- Verify `https://imagegranttech.com/api/health` returns `200 OK`.
- Verify `https://imagegranttech.com/robots.txt` returns `Allow: /`, `Disallow: /admin`, `Disallow: /api`, and `Sitemap: https://imagegranttech.com/sitemap.xml`.
- Verify `https://imagegranttech.com/sitemap.xml` lists all canonical `https://imagegranttech.com/...` URLs.
- Verify `<link rel="canonical" href="https://imagegranttech.com/...">` on public pages.

---

## 9. Future Phase: Final Client Handover & Credential Rotation

Keep the following tasks grouped into the final client handover phase (do **not** execute until ready to hand over):
1. **Resolve CRITICAL-01 (Rotate Administrator Credentials & Revoke Old Sessions):**
   - Update the owner administrator email (if transitioning from `t***u@gmail.com` to an official client email) and rotate the administrator password via the password reset flow (incrementing `sessionVersion` to revoke all prior sessions).
   - Remove `ADMIN_SEED_NAME`, `ADMIN_SEED_EMAIL`, and `ADMIN_SEED_PASSWORD` from local `.env.local`.
2. **Complete Official Business Contact Details:**
   - Once provided by the client, enter the official `primaryEmail`, physical `address`, and social media links in `/admin/settings/business`.
3. **MongoDB Atlas & Render Account Ownership Handover:**
   - Verify the client owns the Render account, MongoDB Atlas project, and Cloudflare domain zone, and rotate database user passwords if temporary developer access was used.

---

## 10. Final Recommendation

### **CONDITIONAL GO (Ready for Custom Domain Cutover with Acknowledged Risk CRITICAL-01)**

`HIGH-01` is resolved and verified live (`Image Grant Technology` branding and phone/WhatsApp contacts active). `CRITICAL-01` is explicitly logged as an acknowledged, unresolved security risk deferred to the **Final Client Handover Phase**. After taking a pre-cutover `mongodump` backup of the `test` database, you may proceed with the Render Custom Domain and Cloudflare DNS cutover for **`https://imagegranttech.com`**.
