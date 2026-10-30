# LED Screen Platform

A full-stack digital marketing, commerce, rental, installation, maintenance, and service-enquiry platform focused on professional LED display solutions. It also provides a future home for institutional bell/alarm systems and Christian/Catholic audio listings.

The product is being developed module-by-module. Modules 1–4 establish the production foundation, secure admin authentication, centralized business settings, and the LED product catalogue. Other business workflows remain intentionally deferred.

## Technology stack

- Next.js 16 App Router, React 19, and strict TypeScript
- Tailwind CSS 4
- MongoDB with Mongoose
- Zod and React Hook Form
- TanStack Query for future client-side server state
- Native server-side data access and Route Handlers (Axios is available for cases where it adds value)
- ESLint and Prettier

## Local setup

Requirements: Node.js 20.9 or newer, npm, and access to a MongoDB deployment.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The health endpoint is available at `/api/health`, and the unprotected admin layout foundation is at `/admin`.

## Environment variables

| Variable               | Visibility  | Purpose                                         |
| ---------------------- | ----------- | ----------------------------------------------- |
| `MONGODB_URI`          | Server only | MongoDB connection string                       |
| `NEXT_PUBLIC_APP_URL`  | Public      | Canonical application URL                       |
| `NEXT_PUBLIC_APP_NAME` | Public      | Display name used in metadata and UI            |
| `AUTH_SECRET`          | Server only | Signs admin sessions; use 32+ random characters |
| `ADMIN_SEED_NAME`      | Server only | Initial owner name used by the seed command     |
| `ADMIN_SEED_EMAIL`     | Server only | Initial owner email used by the seed command    |
| `ADMIN_SEED_PASSWORD`  | Server only | Initial owner password used by the seed command |

Never put secrets in `NEXT_PUBLIC_*` variables. `.env.local` is ignored by Git.

## Commands

```bash
npm run dev          # local development
npm run lint         # ESLint
npm run typecheck    # strict TypeScript check
npm run format       # apply Prettier formatting
npm run format:check # verify formatting
npm run build        # production build
npm start            # serve the production build
npm run seed:admin   # create the initial owner account
```

## Architecture

Application code lives under `src/`. Route groups separate the public shell from the `/admin` shell without changing public URLs. `src/components` contains reusable UI, layout, shared, and admin-shell components; `src/lib` owns database, API, validation, configuration, constants, and utilities; `src/providers` isolates client providers so layouts remain Server Components. Future business models, services, hooks, forms, and feature components should be added only when their modules are implemented.

Database access is server-only and caches the Mongoose connection across development hot reloads. API handlers use typed response helpers and safe client-facing errors.

## Admin authentication

Admin sessions are signed, eight-hour JWTs stored only in secure HTTP-only, SameSite cookies. Protected layouts verify the signature and then load the active admin from MongoDB. A per-admin session version invalidates all old sessions after a password reset. Passwords use bcrypt with 12 salt rounds, and reset tokens are random, one-time-use values whose SHA-256 hashes—not raw tokens—are stored for 30 minutes.

There is no public registration. To create the first owner, configure the three `ADMIN_SEED_*` values in `.env.local`, then run:

```bash
npm run seed:admin
```

The seed validates inputs and refuses to overwrite an existing email. Remove the seed password from `.env.local` after successful setup. Sign in at `/admin/login`.

### Development password-reset testing

Visit `/admin/forgot-password` and submit the seeded email. In development only, the reset URL is logged by the server and included in the successful response UI for local testing. Production responses never contain the token. Replace this temporary delivery path with the future notification/email module.

Login, forgot-password, and reset-password endpoints use an in-memory per-process rate limiter. This is useful for local and single-instance deployments, but production deployments with multiple instances should replace it with a shared Redis or managed rate-limit store. Always deploy over HTTPS, keep `AUTH_SECRET` server-only, and rotate it to invalidate all current sessions when required.

## Business settings

Authenticated administrators manage the primary company profile at `/admin/settings/business`. The singleton settings record covers:

- Company name, short name, tagline, and description
- Logo and favicon URLs
- Email, telephone, and WhatsApp contacts
- Address, map URL, and structured-text opening hours
- Facebook, Instagram, YouTube, LinkedIn, X, and TikTok links

The protected `GET /api/settings/business` and `PUT /api/settings/business` endpoints load and update the same record. Updates are server-validated and record the responsible admin internally. Public components receive a separate safe projection without database identifiers, audit fields, or timestamps.

The public header and footer use the stored business name, logo, contacts, address, social links, and WhatsApp number. If MongoDB or the settings record is unavailable, they fall back to the application configuration. Logo and favicon management accepts validated HTTP/HTTPS URLs for now; file uploads and media management remain deferred.

`createWhatsAppUrl(number, message?)` normalizes the configured telephone number into a reusable `wa.me` link and optionally URL-encodes a pre-filled enquiry message.

## LED product catalogue

Module 4 adds reusable `Product` and `ProductCategory` models scoped to `productType: "led-screen"`. The model keeps commonly filtered LED attributes—category, environment, pixel pitch, brightness, refresh rate, stock, pricing, and publication status—as first-class fields. Arbitrary label/value specifications, marketing features, use cases, supported inputs, and image URLs remain extensible arrays.

Administrators use:

- `/admin/products` for paginated search, filtering, viewing, editing, and archiving
- `/admin/products/new` to create an LED screen
- `/admin/products/[id]` and `/admin/products/[id]/edit` for detail and editing
- `/admin/product-categories` to create, edit, order, activate, and deactivate categories

Public visitors use `/led-screens` and `/led-screens/[slug]`. Only published LED screens are returned publicly. Catalogue URLs preserve search, category, environment, pixel-pitch, and pagination filters.

Pricing supports `fixed`, `contact`, and `quote`. Fixed products require a non-negative amount; contact and quote products may omit it. Publication states are `draft`, `published`, and `archived`. Archiving is used instead of destructive deletion.

### Product APIs

- `GET|POST /api/products`
- `GET|PUT|PATCH /api/products/[id]`
- `GET|POST /api/product-categories`
- `PUT /api/product-categories/[id]`

Writes require an authenticated admin and server-side Zod validation. Public reads exclude drafts and archived products.

Product media remains URL-based. Because administrators may use different hosts, previews are rendered without opening a wildcard Next.js image optimization policy. Add explicit `images.remotePatterns` entries and migrate to `next/image` when approved image hosts or an upload provider are selected.

Product detail pages generate contextual WhatsApp enquiries from Business Settings. Quote buttons already use `/request-quote?product=<slug>` so the future quotation module can adopt the link without changing product pages; no quotation workflow exists yet.

## LED accessories and spare parts

Module 5 extends the same Product and ProductCategory collections with `productType: "led-accessory"`; existing screens remain `led-screen`. Accessories add optional, searchable brand, model number, and SKU fields plus flexible compatibility strings while reusing specifications, features, media, pricing, stock, publication, SEO, slug, and audit infrastructure.

SKU values are optional, trimmed, normalized to uppercase, and protected by a sparse case-insensitive unique index when present. Quantity and stock status provide the product ID, name, SKU, amount, currency, featured image, and available quantity needed by the future cart/order module; this module never deducts stock.

Suggested accessory categories can be installed without overwriting existing category records:

```bash
npm run seed:accessory-categories
```

They remain editable at `/admin/accessory-categories`. Accessory management routes are `/admin/accessories`, `/admin/accessories/new`, `/admin/accessories/[id]`, and `/admin/accessories/[id]/edit`. Public catalogue routes are `/led-accessories` and `/led-accessories/[slug]`.

The existing product API accepts `productType=led-accessory` on list requests, and accessory write bodies include that discriminator. Category APIs accept/filter the same product type. All public reads remain published-only, all writes require an authenticated admin, and archive/restore operations never permanently delete records.

Accessory pages reuse fixed/contact/quote pricing and the Business Settings WhatsApp number. Contextual enquiries are generated without hardcoded contact data. Add-to-cart, orders, inventory deduction, checkout, and payments remain deferred.

## Module 6 — LED Sales & Quotation

Public catalogue enquiries and formal quotations are separate records:

- `QuoteRequest` stores the original customer requirements, selected product ID/name/slug snapshot, dimensions, timing, optional budget, contact preference and reference number. It also holds private status, assignment and admin notes.
- `Quotation` optionally links to an enquiry and stores an independent customer snapshot, addresses, priced line items, totals, validity, status and admin audit fields. Creating a draft does not overwrite the original requirements.
- Services live in `src/services/sales.ts`; schemas in `src/lib/validations/sales.ts`; monetary calculations and status rules in `src/lib/sales/`. Existing Product, Admin, Business Settings and contact utilities are reused.

### Routes and workflow

- `/request-quote` accepts general enquiries; `/request-quote?product=<slug>` prefills a published screen or accessory. Every LED screen and accessory detail page has a Request Quote action. A successful submission displays a `QR` reference, summary and configured business WhatsApp contact.
- `/admin/sales/enquiries` supports search, pagination, status/source/project/assignee/date filters.
- `/admin/sales/enquiries/[id]` displays requirements and customer contact actions, edits status/assignment/private notes, and starts a quotation from the enquiry.
- `/admin/sales/quotations` supports search, pagination, status/currency/date filters.
- `/admin/sales/quotations/new` supports manually entered customers; `?enquiry=<id>` carries customer, product and project context.
- `/admin/sales/quotations/[id]` shows the document, status actions and audit dates.
- `/admin/sales/quotations/[id]/edit` edits drafts. Reopen other eligible statuses as draft to revise pricing. Converted quotations are locked.
- `/admin/sales/quotations/[id]/print` hides the admin shell and presents an A4 document.

Public API: `POST /api/quote-requests`. Protected APIs: `GET /api/quote-requests`, `GET/PUT /api/quote-requests/[id]`, `GET/POST /api/quotations`, `GET/PUT /api/quotations/[id]`, `PATCH /api/quotations/[id]/status`, and `GET /api/sales/catalogue` (product search). List APIs accept `page`, `limit`, `search`, `status`, `from`, `to` and the relevant filter fields. Updates require the record's `version`; conflicting edits return HTTP 409.

Enquiry statuses: `new`, `contacted`, `reviewing`, `quoted`, `won`, `lost`, `closed`. Admins manage enquiry status separately from quotation status, since one enquiry can have several quotations.

Quotation statuses: `draft`, `sent`, `viewed`, `accepted`, `rejected`, `expired`, `converted`, `cancelled`. The normal sequence is draft → sent → accepted/rejected/expired, then accepted → converted. Eligible records can reopen as draft for recovery. `sent` and `viewed` records past their validity date display and filter as expired at read time; no cron job is required. Marking sent/viewed is an admin action, not email delivery or customer tracking. Acceptance/rejection/conversion timestamps and creator/updater references are retained. Conversion records status and time only; it does not create orders, invoices or payments.

### Numbering and money

Atomic MongoDB counters generate `QR-YYYY-00001` and `QT-YYYY-00001` using the UTC year. Counter IDs are unique, increments are atomic and initial upsert races are retried. References also have unique model indexes. Gaps are expected after failed writes; never reset counters on a live database.

All quotation monetary values and enquiry budgets are **integer minor units**, including API inputs: NGN 1,500,000.00 is `150000000`. Forms and documents display major units. Existing catalogue prices remain major-unit decimals; the service explicitly converts them using decimal rounding when taking a price snapshot. Supported two-decimal currencies are centralized in `src/lib/sales/constants.ts` (NGN default; also USD, GBP, EUR, GHS, ZAR, KES). No exchange conversion is implicit. Business Settings currently has no currency field.

Line items support catalogue screens/accessories and manual services/custom items. A catalogue addition captures product ID, name, description, SKU and current price. Negotiated unit prices are editable; later product price changes do not alter saved quotes. Items allow quantities to three decimal places, a unit and an optional fixed line discount.

Server calculation order:

1. Round `quantity × unitPrice` half-up to a minor unit; subtract the line discount.
2. Sum line totals into subtotal.
3. Subtract a fixed quotation discount or percentage discount (0–100%, two decimals).
4. Calculate and round the configured tax on the discounted subtotal.
5. Add delivery, installation and other fees. Fees are not taxed by this calculation.

Integer/BigInt arithmetic avoids floating-point accumulation. Discounts cannot exceed their base amount. Amounts are bounded at `1,000,000,000,000` minor units. Client-supplied totals are stripped and recalculated server-side. Tax defaults to zero and is configurable per quotation.

### Printing, contact and security

Browser print offers **Save as PDF**; no PDF service/library is installed. Use A4 and disable browser headers/footers. Documents use Business Settings (logo, name, address, email and phone). If settings cannot load, printing fails visibly instead of using example contact details. Business details are current settings; customer/product prices are stored snapshots.

Call, email and WhatsApp actions reuse existing contact utilities and customer/business numbers. Admin WhatsApp sharing opens a prepared message containing the quotation number; sending remains a deliberate action in WhatsApp. Customer email can be copied. There are no public quotation URLs or share tokens in Module 6; send the saved PDF manually. Email delivery can be added around the quotation service later.

Admin routes and APIs use existing authentication. Public responses contain confirmation data only, never internal IDs, assignment, admin notes or audit fields. Inputs are trimmed, bounded, validated with Zod and rendered as escaped text; public users cannot set statuses, snapshot values or totals. Optimistic concurrency protects admin edits. The public endpoint reuses the application's process-local rate limiter (5 attempts per 15 minutes per IP). Production deployments must have a trusted proxy that overwrites forwarding headers; multi-instance deployments need a shared limiter. Submit/save controls disable while pending.

### Verification

```bash
npm run test:sales
npm run lint
npm run typecheck
npm run build
npm run test:sales:integration
```

The integration test requires the production build, starts a temporary MongoDB and a separate Next server on port 3106, seeds synthetic fixtures, and verifies APIs and browser workflows. It **never uses the application's Atlas database**. MongoDB Memory Server downloads a test binary on first use; Chromium is provided by local Google Chrome on macOS or a Playwright browser installation (`npx playwright install chromium`). The suite pins MongoDB 7.0.14 for compatibility with macOS 13. Set `SALES_TEST_MONGODB_VERSION`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE` or `SALES_TEST_PORT` if needed. Browser screenshots/PDF are written to ignored `test-results/`. All temporary database data is removed after testing.

Known Module 6 limits: no public acceptance/sharing, email sending, automatic expiration writes, full audit event history, currency conversion, stock reservation, order/payment creation or transactional linkage between enquiry and quotation status. These belong to later modules.

## Module 7 — LED Screen Rental

Rental requests and confirmed bookings are separate records. `RentalRequest` stores customer and event requirements, dates, venue, screen requirements, optional support services, product snapshot, assignment, notes, quotation link and status. `RentalBooking` stores a customer/event snapshot, reserved equipment, service lines, booking windows, deposit/payment foundation, commercial status and operational status.

Public routes are `/rent-led-screen` and `/rent-led-screen/request?product=<slug>`. Only published LED screen products with `isRentable` enabled appear in the selector. The public request API is `POST /api/rental-requests`, rate-limited and server validated. Admin requests are under `/admin/rentals/requests`; bookings under `/admin/rentals/bookings`; and upcoming bookings under `/admin/rentals/calendar`.

Rental quote creation reuses Module 6 `Quotation` with `quotationType: rental` and `rentalRequestId`. An accepted rental quotation can be converted through `POST /api/quotations/[id]/rental-booking`; conversion validates the linked request, creates an `RB-YYYY-#####` booking, snapshots equipment/services, and rechecks availability. Rental references use the existing atomic sales counter (`RR-YYYY-#####` and `RB-YYYY-#####`).

Availability is calculated on the server from `Product.rentalQuantityAvailable` minus quantities in overlapping `pending-confirmation` or `confirmed` bookings. Windows use half-open interval overlap (`start < otherEnd && end > otherStart`) with no additional buffer. Confirmation and booking conversion are blocked when the requested quantity exceeds the remaining amount. Product sales quantity is never used as rental inventory.

Booking statuses are `draft`, `pending-confirmation`, `confirmed`, `cancelled`, and `completed`. Operational statuses are `preparing`, `dispatched`, `setup-in-progress`, `ready`, `event-active`, `dismantling`, `returned`, `inspected`, and `closed`. Deposit states are `not-required`, `pending`, `partially-paid`, and `paid`; amount paid and balance are recalculated server-side. Rates, totals and booking money use Module 6 integer minor units.

Browser print is available at `/admin/rentals/bookings/[id]/print` and uses Business Settings. WhatsApp, phone and email actions use existing contact utilities. There is no payment gateway, public booking acceptance, automatic inventory calendar, stock reservation transaction, email delivery, or full order system in Module 7.

Rental validation and duration/availability primitives are covered by `npm run test:rentals`; database-backed rental verification should be run in the application environment with a test MongoDB database because the service layer is server-only.

## Module 8 — LED Installation

Module 8 adds a permanent LED installation workflow: public installation requests (`/led-installation/request`), protected request and site-assessment management, quotation integration (`quotationType: installation`), and conversion of accepted quotations into installation projects. Requests use atomic `IR-YYYY-#####` references; assessments and projects use `SA-YYYY-#####` and `IP-YYYY-#####`.

Installation projects retain customer/site/equipment snapshots, schedules, assigned staff, tasks, progress, commissioning, handover and warranty foundation fields. Admin routes are under `/admin/installations/requests`, `/admin/installations/assessments`, `/admin/installations/projects` and `/admin/installations/schedule`; APIs are under `/api/installation-requests`, `/api/site-assessments` and `/api/installation-projects`. Totals reuse the Module 6 minor-unit quotation strategy. Public requests are rate limited and selected products are verified and snapshotted. Payment, notifications, uploads and maintenance workflows remain future modules.

## Module 9 — LED Maintenance & Repairs

Module 9 adds rate-limited public maintenance requests at `/led-maintenance/request` and protected admin request, job, schedule, and printable service-report routes. `MaintenanceRequest` supports screens installed by this business, external installations, and unknown equipment. Requests can be converted into snapshot-based `MaintenanceJob` records with technician assignment, diagnosis, repair actions, parts, labour, testing, warranty decisions, completion recommendations, next-service dates, and service-history queries. Maintenance quotations reuse the Module 6 quotation engine with `quotationType: maintenance` and request/job links. Payment, notifications, uploads, inventory deduction, and maintenance contracts remain future work.

## Module 10 — Electronic Bell & Alarm

Module 10 extends the shared Product model with `bell-alarm-system` and `bell-alarm-accessory` types and optional system capability fields. Public catalogue and enquiry routes are `/electronic-bell-alarm`, `/electronic-bell-alarm/products`, `/electronic-bell-alarm/accessories`, and `/electronic-bell-alarm/request`. Requests use atomic `BA-YYYY-#####` references, are rate limited, snapshot selected products, and reuse the Module 6 quotation engine with `quotationType: bell-alarm`. Protected admin routes cover product listings and request management. Bell/alarm equipment can be associated with shared installation and maintenance workflows. Schedule configuration is documentation only; physical hardware programming requires technician work or a future documented device API. Payments, notifications, inventory movements, and remote hardware control are not implemented.

## Module 11 — Christian/Catholic Music & Audio

Module 11 adds a curated `MusicContent`, `MusicCategory`, and `MusicArtist` catalogue with protected admin management and public discovery routes under `/music`. Content stores external source/embed URLs and metadata; YouTube and Spotify URLs are normalized only to allowlisted embeds. Owned audio requires explicit `client-owned` or `licensed` rights metadata, and no download feature is provided. Public pages include featured/latest content, browse, category, artist, detail, and official-source links. Third-party copyright remains the client’s responsibility; the platform does not scrape, re-host, or distribute copyrighted audio.

## Module 13 — Projects & Portfolio

Module 13 adds public-safe portfolio case studies through `PortfolioProject` and `PortfolioCategory`. Public routes are `/projects` and `/projects/[slug]`; protected management is under `/admin/portfolio`. Projects store snapshots and never expose customer contacts, quotations, payments, admin notes, or internal IDs. External relationships to installation, rental, bell/alarm, or maintenance records are optional. Image and video fields accept URLs only, and public content is limited to published projects. Portfolio content is designed for future gallery/testimonial and SEO enhancements; no fake projects or testimonials are generated.

## Module 14 — Gallery & Testimonials

Module 14 adds curated, public-safe visual media and customer social proof. `GalleryItem` and `GalleryCategory` support image/video references, service classification, optional PortfolioProject links, featured ordering, and draft/published/archived states. Media is URL-based unless an existing upload provider is configured; YouTube and Vimeo links are normalized to trusted embeds, and arbitrary iframe HTML or unsafe protocols are rejected.

`Testimonial` records require explicit `consentConfirmed` in addition to published status before appearing publicly. Customer private contact and audit fields are excluded by public-safe mappers. Gallery and testimonial administration is available at `/admin/gallery`, `/admin/testimonials`, with public pages at `/gallery`, `/gallery/[slug]`, and `/testimonials`. Featured gallery media and consented testimonials are loaded in small sets on the homepage. Portfolio links remain optional, allowing historical/manual entries without recreating operational projects. This module deliberately does not provide downloads, content scraping, or unrestricted media hosting; the business remains responsible for rights to owned/licensed media.

## Module 15 — Shopping Cart & Orders

Module 15 adds guest-first purchasing for explicitly eligible products. Products require `status=published`, `priceType=fixed`, a valid price, and `isPurchasableOnline=true`; quote/contact products and custom LED projects remain enquiry-led. Cart state is public-safe and persisted in localStorage, while checkout reloads products and recalculates authoritative minor-unit prices on the server.

Orders use immutable product snapshots, `ORD-YYYY-#####` numbering, secure hashed public tokens, fulfilment methods (delivery/pickup/arrange-with-us), customer-safe confirmation pages, and authenticated admin order views/status updates. New orders are unpaid and no payment gateway is included. Tracked stock is atomically deducted when an admin confirms an order and restored once on cancellation; non-tracked products are not stock constrained. Module 16 can add verified payment providers later without changing the order contract.

Public routes: `/cart`, `/checkout`, `/orders/[token]`. Admin routes: `/admin/orders`, `/admin/orders/[id]`. Public order pages intentionally omit admin notes, internal IDs, and unnecessary personal data.

## Module 16 — Online Payment

Module 16 integrates Paystack through server-only initialization and verification. Configure `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (reserved for future client-side flows), and `PAYSTACK_WEBHOOK_SECRET` if used by deployment configuration. Use Paystack test keys during development and configure the production webhook URL as `/api/webhooks/paystack` in the Paystack dashboard.

Payment amounts are derived from the saved Order and sent in the existing minor-unit convention (NGN kobo). Callback and webhook paths both verify the provider reference, amount, currency, and order association; neither trusts a browser success callback. Payment attempts are stored separately, retries receive new references, and duplicate verification/webhooks are safe. Valid online payment marks the order paid and uses the existing atomic inventory-confirmation path once. No card data, payment secrets, or raw gateway payloads are stored client-side.

Public payment routes include `/payment/callback` and secure order-token pages. Admin payment records are available at `/admin/payments`. Manual/offline payment marking remains an authenticated admin operation and is distinct from provider verification. No refunds, virtual accounts, notifications, or payment gateway beyond Paystack are implemented yet.

## Module 17 — WhatsApp & Contact System

Module 17 centralizes customer contact links and contextual WhatsApp messages while preserving the operational QuoteRequest, RentalRequest, InstallationRequest, MaintenanceRequest, BellAlarmRequest, Order, and Payment models. Phone numbers are normalized for Nigerian and international formats; invalid configured numbers hide WhatsApp actions. Helpers cover general, product, quotation, rental, installation, maintenance, bell/alarm, order, and payment contexts.

`ContactEnquiry` provides a lightweight general-contact workflow with `CE-YYYY-#####` references, service/enquiry routing, source tracking, priority/status, optional related-record IDs, assignment, and private communication notes. Public submissions are rate-limited, validated, sanitized, honeypot-protected, and return only a reference. Admin management is available at `/admin/enquiries`; the public form is `/contact`. WhatsApp integration uses `wa.me` deep links only: the platform never claims to send, deliver, or read messages, and no WhatsApp Business API or chatbot is implemented.

## Module 18 — Notifications

Module 18 adds a lightweight notification service with persisted in-app admin notifications, typed domain events, optional Resend email delivery, dedupe keys, delivery status, and retry-ready records. Contact enquiry creation, order creation, and verified payment success emit notification events without blocking their business transactions. Admin notifications are available at `/admin/notifications`, with an unread bell in the admin header.

Configure optional `RESEND_API_KEY` and `EMAIL_FROM` for email delivery. Without them, in-app notifications continue and email records are marked skipped rather than falsely sent. `CRON_SECRET` protects `/api/internal/notifications/process-reminders`; the reminder endpoint is intentionally a foundation and requires production scheduler configuration later. WhatsApp and SMS are not automated channels in this module. Notification records exclude secrets and customer-facing templates must use secure public tokens for links.

## Module 20 — SEO & Discoverability

Module 20 adds Business Settings-backed root and page metadata, absolute canonicals, published-only dynamic metadata/sitemap entries, robots/index controls, social sharing/verification fields, safe JSON-LD and visual breadcrumbs. Product offers require a real fixed price; quote/contact products have no fabricated offer or ratings. Admin/auth/API, cart/checkout, order/payment and request-result routes remain outside search indexing. Public portfolio customer privacy is preserved.

Configure `NEXT_PUBLIC_APP_URL` as the single canonical origin. `ALLOW_SEARCH_INDEXING` defaults to enabled in production and disabled in development; explicitly set `false` on staging/preview/local production servers and `true` for the live public site. There is no automatic Search Console submission, analytics installation or ranking guarantee: search engines decide crawl, indexing and ranking behavior.

MongoDB Atlas selection/connect timeouts default to 5 seconds so temporary replica-set primary outages fail quickly. Set `MONGODB_SERVER_SELECTION_TIMEOUT_MS` only when a different operational timeout is required. The homepage keeps its configured marketing shell available when optional catalogue/content queries cannot reach the database; transactional and detail operations still require a healthy database.

See [Module 20 route audit, architecture, privacy, media, verification and Search Console checklist](docs/module-20-seo.md) for route decisions, file responsibilities, sitemap/robots behavior, schema types, social metadata, slug/location restrictions, known limitations and developer actions. Modules 21 and 22 are not included.

## Module 21 — Security & Validation

Security hardening, bounded Zod-validated mutations, authentication/session protections, payment/webhook verification, privacy-safe public DTOs, security headers, and operational guidance are documented in [docs/security.md](docs/security.md). Module 21 does not deploy the application or claim perfect security; complete the production checklist before release.
