# Module 20 — SEO & Discoverability

## Route review and decisions

The existing application uses `src/app/(public)` with shared Business Settings, header/footer, server components, Mongoose public lookups, and client forms. Administrative pages use `(admin)/admin`; authentication uses `(auth)/admin`. Route groups do not appear in URLs. All existing public pages, shared media/navigation, metadata, service publication filters, order/payment routes, quotation APIs and admin/auth layouts were reviewed before implementation.

| Routes | Classification and SEO behavior |
| --- | --- |
| `/`, `/about`, `/contact`, `/services` | Indexable marketing; unique metadata, canonical, one main/H1 |
| `/led-screens`, `/led-accessories` | Indexable base catalogues; query filters/search and pagination are noindex, follow |
| `/led-screens/[slug]`, `/led-accessories/[slug]` | Published products only; metadata, product schema and breadcrumbs |
| `/rent-led-screen`, `/led-installation`, `/led-maintenance` | Indexable services; factual Service schema and related links |
| Service `/request` routes | Public transactional forms; noindex, nofollow at layout level, excluded from sitemap |
| `/electronic-bell-alarm` | Indexable service overview |
| `/electronic-bell-alarm/products`, `/electronic-bell-alarm/accessories` | Indexable product collections |
| Bell `/products/[slug]`, `/accessories/[slug]` | Published, matching product type only; cross-type URL returns 404 |
| `/music`, `/music/browse` | Indexable music collections; cards without embedded players |
| `/music/[slug]` | Published content; title/artist/category context, cover, external-provider wording |
| `/music/artists` | Added small directory of published artists; linked from music hub |
| `/music/artists/[slug]`, `/music/category/[slug]` | Actual published artist / active category data; missing/inactive returns 404 |
| `/projects`, `/projects/[slug]` | Published portfolio; privacy-safe metadata, CreativeWork and breadcrumbs |
| `/gallery`, `/gallery/[slug]` | Published media; admin alt text, thumbnails in listing, linked details |
| `/testimonials` | Published and consent-confirmed feedback, public display names only; no rating/review schema |
| `/request-quote` | Indexable conversion page; selected-product query variant noindex; client confirmation state emits noindex |
| `/contact` submitted state | Client-only reference; emits noindex. Reference is never encoded in a canonical or sitemap |
| `/cart`, `/checkout` | Noindex, follow; excluded from sitemap |
| `/orders/[token]` | Token-protected transaction; noindex, nofollow; no canonical containing token |
| `/payment/callback` | Transactional status; noindex, nofollow through server layout |
| `/admin/**` including login/forgot/reset | Noindex, nofollow through both layouts and HTTP headers; existing authentication remains |
| `/api/**` including health, payments, webhooks, orders/public token and internal reminders | API/internal; `X-Robots-Tag: noindex, nofollow`, robots exclusion, no sitemap entries |
| `/quotation/**`, `/quotations/**` | No public quotation-token page currently exists. Existing quotation APIs/admin pages remain private. Reserved robots exclusions; future public token UI must use a noindex layout |

LED categories currently use catalogue query filters. Portfolio categories have no public category route. Neither was expanded into thin category pages. Existing music categories are preserved. No location/doorway pages, speculative redirects, analytics or tracking cookies were introduced.

## Architecture and configuration

- `src/lib/seo/urls.ts`: central `getSiteUrl`, `absoluteUrl`, canonical construction, environment control. Canonicals strip query/hash/trailing slashes. Unfiltered pagination retains `?page=N`; noindex paginated pages are not falsely canonicalized to page one. Filtered variants point to the base catalogue and are noindex. Tracking-only parameters canonicalize to the clean route. Published slugs are not changed.
- MongoDB connection selection and connect timeouts default to 5 seconds (capped at 30 seconds) so an Atlas primary outage does not hold public requests for the driver's long default timeout. Override with `MONGODB_SERVER_SELECTION_TIMEOUT_MS` when operationally necessary.
- `NEXT_PUBLIC_APP_URL`: single absolute HTTP(S) origin, no credentials, path, query or fragment. Production requires an explicit value; development can use localhost. Configure the real HTTPS origin before a production build, because Next.js embeds public environment variables. No domain is hardcoded. WWW/HTTPS redirect enforcement is deferred to Module 22.
- `ALLOW_SEARCH_INDEXING`: `true` enables public indexing; `false` disables it site-wide, disallows `/` in robots and returns an empty sitemap. Empty/unset defaults to production enabled, development disabled. **Explicitly set false for staging, previews and local production servers.** Hostnames are not used to guess environment.
- `metadata.ts` and `pages.ts`: typed metadata/robots/product/portfolio/music builders and unique static route descriptions. Root metadata uses cached, failure-safe public Business Settings for title template, defaults, application name, base URL, Open Graph, Twitter and configured verification. No invented author identity.
- Business Settings supports optional `seoDefaultTitle`, `seoDefaultDescription`, `ogImageUrl`, `twitterHandle`, `googleSiteVerification`, `bingSiteVerification` through schema, model, service DTO and admin form. No keywords field is needed; no second canonical-origin setting is introduced. Verification tokens are public metadata, never credentials.
- Optional settings failures fall back to site configuration without example phone/email/address. Content database failures still use the existing application error handling rather than disguising failures as empty published content.
- Dynamic detail pages use `generateMetadata` and request-memoized published lookups shared with rendering. Admin mutations do not share public lookup caches.
- `robots.ts`: production public allow rule with admin/API/transaction/request exclusions. Robots is crawl guidance, not authentication, and a crawler blocked by robots may not see a page's noindex directive. Existing token/auth controls remain essential.
- `sitemap.ts` and `services/seo-sitemap.ts`: static allowlist plus minimal `slug`, type and `updatedAt` projections for published products, projects, music, gallery, published artists and active music categories. No catalogue page-size truncation, duplicate URLs, fabricated dates or customer data. Each dataset can fail independently; connection failure returns static entries only. No draft/archive/private fallback. The single sitemap can be split at this service boundary when approaching sitemap limits.

## Structured data and privacy

`JsonLd` safely serializes JSON, escaping HTML-sensitive characters and Unicode line separators. Data is assembled from explicit fields, never arbitrary HTML or a spread of a database record.

- Organization uses actual configured name, logo, contact and social URLs. Generic LocalBusiness is used only when a street address and city are configured. No inferred opening hours, coordinates, service areas or ratings.
- WebSite appears on the homepage; no SearchAction is claimed.
- Product appears on published product details. Offer exists only for a finite non-negative fixed price and a three-letter currency. Quote/contact products have no numeric offer. Explicit in-stock/low-stock and out-of-stock/unavailable map to their corresponding schema values; made-to-order is not guessed as PreOrder.
- Service describes rental, installation, maintenance and bell services. No quote-based service prices or invented areaServed.
- CreativeWork describes portfolio projects. No NewsArticle, fabricated authorship or ownership claims for external music.
- BreadcrumbList mirrors visible route/entity breadcrumbs. No admin hierarchy or internal identifiers.
- No AggregateRating or Review schema. Published consented testimonials remain ordinary content.

Public portfolio mapping removes hidden customer and internal linked-record fields and redacts the configured hidden name from titles, descriptions, SEO overrides and displayed case-study prose. Metadata, schema and alt text use that public mapping. Admin data remains editable. Bell schema/metadata reads only public product name, SEO/short description, image and legitimate price fields; installation request/job details are never queried. Editors must still review free text, slugs and uploaded assets for privacy: automated redaction cannot identify arbitrary undisclosed identities or sensitive details embedded in an image.

## Content and media review

Major public pages have one H1 and one main landmark; nested mains were removed. Detail breadcrumbs, gallery links, artist directory and relationships, footer services/rental links and service/product support links improve discovery. Existing related-product/project/music helpers remain in use. Normal internal links use Next Link; external provider links preserve safe new-tab behavior.

Product images are semantic `img` elements with product-context alt text and reserved aspect-ratio space. Detail primary images load eagerly; secondary images load lazily. Gallery listings/home use configured thumbnails and existing admin alt text. Listing music covers and project images load lazily within reserved ratios. Music embeds remain on details. Remote assets retain the existing hosting architecture: no arbitrary external image host allowlist or new image-processing provider was introduced.

The global loading boundary was moved to the admin segment so public entity lookups can resolve not-found status before a loading shell commits HTTP 200. Public request-form loading UI remains. Missing/unpublished entities use `notFound()` rather than a success-shaped fallback.

## Slugs, limitations and next steps

Generated product/music slugs are readable and unique; existing published URLs are preserved. Portfolio/gallery/category admin forms permit explicit slugs. Changing a published slug affects existing links and indexing: keep it stable, and plan an explicit permanent redirect before an intentional change. A redirect manager and speculative redirects were not added. Do not enter IDs or location keywords as a substitute for a descriptive slug. Do not create city-specific pages without real operations and distinct useful content.

SEO implementation does not guarantee search ranking. Search engines decide crawl, index and ranking behavior. Empty catalogues/artist profiles/categories may provide limited search value; curate content before promoting them. Paginated results deliberately stay noindex until an editorial indexing strategy warrants otherwise. No default social raster is fabricated: entity image, configured OG image, then configured logo are used; without any configured image, Twitter uses a summary card. Existing static favicon remains the fallback. Remote image accessibility/size, live-domain redirects, provider social preview caches and Search Console interpretation need checks on the actual deployment. Full performance/security/deployment work is outside Module 20.

Before going live:

1. Set the real canonical HTTPS origin and the production indexing flag. Set staging indexing false.
2. Populate accurate business/contact/social data and an accessible sharing image. Review all public SEO overrides and portfolio privacy.
3. Verify the domain in Google Search Console (DNS or configured Google token); optionally verify Bing using its configured token.
4. Open `/robots.txt` and `/sitemap.xml` on that domain, then submit the sitemap in Search Console.
5. Inspect representative URLs, indexing/coverage reports and social previews; monitor actual crawl outcomes. No submission or verification has been performed by this implementation.
6. Analytics remains an optional future integration with appropriate consent considerations.

Module 21 may separately review security and validation. It has **not** been started here. Module 22 optimization/deployment also remains separate.

## Verification commands

```sh
npm run lint
npm run typecheck
npm run build
node --import tsx --test tests/*.test.ts
npm run test:seo:integration
npm run test:sales:integration
```

The integration tests use an ephemeral local MongoDB and local production Next server, not Atlas. They require permission to bind local ports and launch Chromium. SEO fixtures use the reserved `https://seo.example.test` origin; build with that `NEXT_PUBLIC_APP_URL` when running those tests. Do not deploy the fixture build. Build with the actual production origin for release. Optional settings/sitemap failure behavior is tested without a database; no live payment verification, real email, notifications or Search Console actions are performed.

## Changed-file inventory

Created:

- `src/lib/seo/{urls,metadata,pages,privacy,structured-data}.ts`
- `src/components/seo/{json-ld,breadcrumbs}.tsx`
- `src/services/seo-sitemap.ts`, `src/app/robots.ts`, `src/app/sitemap.ts`
- Public noindex layouts under `cart`, `checkout`, `orders`, `payment`, and each of the four service `request` directories
- `src/app/(public)/music/artists/page.tsx`
- `tests/seo.test.ts`, `tests/seo.integration.ts`, this route-audit document

Modified:

- Root layout; public layout; admin/auth layouts; public marketing, catalogue, product, project, gallery, music, artist and category pages listed in the route table
- Business Settings validation, model, public type, service, and admin form; fallback site config
- Public music, portfolio, gallery and bell lookup services (memoization, public portfolio redaction, music relationships)
- Shared footer, product media, music card, contact and quote confirmation components
- `next.config.ts` for API/admin noindex headers; `package.json` SEO test commands; `.env.example`; `README.md`

Moved `src/app/loading.tsx` to `src/app/(admin)/admin/loading.tsx`. Existing unrelated working-tree changes were preserved. No commits, pushes, remotes, secrets or `.env.local` were changed.

### Existing regression discovered

The pre-existing sales integration suite passes its first eight checks, then quotation creation (`POST /api/quotations`) returns 500 instead of 201. `createQuotationSchema` defaults `rentalRequestId`, `installationRequestId`, `maintenanceRequestId`, `maintenanceJobId` and `bellAlarmRequestId` to empty strings, while `quotationValues` only normalizes `quoteRequestId`. The other five fields therefore cause Mongoose ObjectId CastErrors. This was independently reproduced against the quotation model without a database. Those sales validation/service/model files were not changed by Module 20. Developer follow-up is required; full Modules 1–19 regression success cannot be claimed. No live payment-provider checks were performed.

### Final Module 20 verification results

- Production webpack build: passed, with no database required at build time and a reserved fixture canonical origin.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 0 errors and 52 warnings (including existing unused directives/variables and native-image warnings).
- All unit tests: 38 passed, 0 failed.
- Final SEO integration suite: 37 checks passed, including all major public page metadata/landmarks, JSON-LD parsing, published/draft/archive behavior, actual HTTP 404 responses, sitemap/robots responses, authenticated admin noindex, a valid tokenized order, portfolio/testimonial privacy, mobile overflow, gallery thumbnails, external-music listing behavior, database-unavailable fallback and staging noindex.
- Existing sales integration: first eight checks passed; quotation creation failed for the independently confirmed existing ObjectId issue described above.
- `git diff --check`: passed. Final git status reviewed; original unrelated changes retained. No commit or push performed.
