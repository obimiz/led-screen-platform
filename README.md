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
