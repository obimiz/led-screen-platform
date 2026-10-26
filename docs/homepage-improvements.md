# Homepage and organisation management

## Architecture and scope

Reviewed the App Router public homepage/layout, header/footer, Business Settings model/service/form, shared Product model and validation, product APIs/admin/catalogue/detail pages, gallery/portfolio, media components, admin navigation/dashboard, MongoDB connection, session authentication, sales API/error helpers, SEO metadata/JSON-LD, Tailwind v4 global theme, and existing loading/error/empty states. Read the installed Next.js video, route-handler and server/client guides before implementation.

The existing architecture and product collection are retained. Organisations are independent records with no project, portfolio, product, testimonial or gallery relationships. No logos, videos, testimonials, project claims, prices or specifications were fabricated. Test-only fixtures are confined to ephemeral MongoDB databases.

## Homepage

The homepage now follows hero → organisations → services → featured products → applications → existing gallery → reasons to choose the business → existing testimonials. Existing accessories, bell/alarm, music, final quote/WhatsApp CTA and public header/footer remain available.

The HTML5 hero uses autoplay, muted, loop, playsInline, an MP4 source and no native controls. A separate accessible pause/play button is available when playing. Media uses object-cover behind a restrained overlay and real HTML headings/links. The desktop hero is approximately 75svh; mobile uses a content-safe 560px minimum.

- Expected video: `public/videos/image-grant-hero.mp4`.
- Existing poster reused: `public/Images/hero/hero-led-screen.jpeg` (case-sensitive).
- No absent video request is issued when the server cannot find the file.
- Missing/rejected video retains the poster; failed poster retains the dark brand background.
- Reduced-motion, screens below 768px, save-data and detected 2G connections use the poster.
- Video preload is `none`; autoplay starts only after preference checks. No animation dependency was installed.
- Supply a genuine compressed H.264 MP4, roughly 10–20 seconds, no audio, preferably 1080p, ideally below 8 MB with fast-start metadata. Redeploy after adding it.

## Organisations

`ClientOrganisation` contains name, stable unique slug, optional logoUrl/location/website, displayOrder, featured, active, and timestamps. Admin → Organisations supports list, create, edit, activation, featured selection, order and confirmed deletion. Loading, empty, error, retry and saving states are provided. Existing admin session checks guard GET/POST `/api/organisations` and PUT/DELETE `/api/organisations/[id]`. Public rendering reads only active and featured records, sorted by displayOrder then name, directly on the server.

The CSS marquee has one mobile row and two opposing desktop rows for eight or more organisations. Equal repeated groups make the loop continuous. Hover, focus and touch interaction pause movement; a persistent pause checkbox is also provided. Reduced motion removes animation and wraps the original records. Duplicate copies are inert and hidden from assistive technology. Official website links are optional and use noopener/noreferrer. Logos use contained, padded boxes; missing or failed images display initials. An empty list or database error omits the section rather than inventing clients.

Put official assets in `public/images/clients/` and enter their `/images/clients/...` paths in admin, or use the existing URL-based image strategy. No cloud provider is assumed.

Run `npm run seed:organisations` against the intended configured database to insert the ten supplied names. This uses existing environment/connection conventions and `$setOnInsert`, matches stable slugs or existing exact names, preserves manual edits, supplies no logos/websites or inferred location fields, and never logs credentials. The seed was tested only against an isolated temporary database; the application database has not been seeded by this task.

## Products

Existing description, currency, price and featured fields are reused. Existing lowercase stored modes remain compatible: `fixed`, `contact`, `quote`; added modes are `from` and `per_sqm`. The Product model already consumes the shared enum, so no duplicate model fields or migration were required. Numeric modes require a price in validation. LED and accessory admin forms expose the price field for all numeric modes. Currency retains existing per-product values and NGN default.

Cards now include clamped descriptions, category/environment/pixel pitch, locale-aware price, details and a product-specific quote link. Missing prices display Request Price rather than a fabricated zero. Shared product images recover from failed loads, including homepage gallery images. Existing add-to-cart eligibility remains fixed-price only. Homepage products remain limited to six featured, published records. Product metadata and structured data retain the existing architecture; non-fixed pricing is not misrepresented as a fixed Offer.

## Files created by this task

- `src/components/home/hero-media.tsx`
- `src/components/organisations/organisation-logo.tsx`
- `src/components/organisations/organisation-marquee.tsx`
- `src/components/organisations/organisation-manager.tsx`
- `src/models/client-organisation.ts`
- `src/services/organisations.ts`
- `src/lib/validations/organisation.ts`
- `src/lib/constants/organisations.ts`
- `src/lib/utils/product-price.ts`
- `src/app/api/organisations/route.ts`
- `src/app/api/organisations/[id]/route.ts`
- `src/app/(admin)/admin/organisations/page.tsx`
- `scripts/seed-organisations.ts`
- `tests/homepage.test.ts`
- `tests/homepage.integration.ts`
- `public/videos/README.md`
- `public/images/clients/README.md`
- `docs/homepage-improvements.md`

## Existing files modified by this task

- `src/app/(public)/page.tsx`
- `src/app/globals.css`
- `src/components/products/product-card.tsx`
- `src/components/products/product-media.tsx`
- `src/components/products/price-display.tsx`
- `src/components/forms/product-form.tsx`
- `src/components/forms/accessory-form.tsx`
- `src/lib/constants/products.ts`
- `src/lib/constants/navigation.ts`
- `src/lib/validations/product.ts`
- `package.json` (seed and test scripts only)
- `src/app/(public)/led-accessories/page.tsx` (existing lint issue: unchanged settings binding made const)

The workspace already contained substantial tracked modifications and untracked modules. Those changes were preserved. No commit, push, history rewrite, remote change or database configuration change was performed.

## Validation

Results:

- `npm run lint`: passed with 0 errors and 52 warnings (existing warning categories plus retained URL-based image usage).
- `npm run typecheck`: passed.
- `node --import tsx --test tests/*.test.ts`: 42 passed, 0 failed.
- `npm run test:homepage:integration`: 10 check groups passed, including all six viewport widths.
- `npm run build`: passed (production webpack build).
- `git diff --check`: passed.
- `npm run test:sales:integration`: failed at POST `/api/quotations`, HTTP 500 instead of 201, after eight preceding check groups passed. The failing quotation implementation was not changed by this task; its cause remains unresolved.
- `npm run test:seo:integration`: failed the homepage canonical URL assertion. The suite expects `https://seo.example.test`; a build-time public-origin mismatch is the likely cause, but was not fully verified. The existing canonical implementation was preserved. A build configured for the suite's origin was not performed.

No claim is made that every pre-existing module passed an end-to-end test. The new integration test uses a production Next server, ephemeral MongoDB and browser fixtures to cover protected APIs, CRUD, active/featured filtering, sorting, all six requested viewport widths, missing assets, reduced motion, pause behaviour, product prices/details/quote selection, admin form operations, empty state, seed idempotency and database outage handling. Screenshots are written to `/private/tmp/homepage-{width}.png`.

Successful playback and visual loop quality of the final real video cannot be verified until that asset is supplied. Production data, live payments and external notification delivery were not exercised. Broader regression failures must be reported rather than treated as passed.


# Homepage content and presentation

`/admin/settings/homepage` now includes an Our Services form for the section heading, introduction, four service titles/descriptions/links, and call-to-action label/link. Saving persists `homepageServices` on the primary MongoDB BusinessSettings document through the authenticated, same-origin `/api/settings/homepage` POST handler. Existing Hero and accessories settings are saved independently. Existing service copy remains the default; no migration is required.

The Hero has no label above its headings. Heading 1 uses a responsive 30–48px scale; Heading 2 uses a lighter 24–36px green treatment. Descriptions use 16–18px text with readable line spacing. Leading dash prefixes are removed at render time; saved text, internal hyphens, original imagery, video behavior and buttons are preserved.

The homepage has separate LED Screen Accessories and Video Accessories sections. Products can be assigned “Video accessory” through the existing accessory form's Homepage classification. Legacy Video Processors, Video Accessories, Video Switchers, Capture Cards and Live Video Accessories categories also appear in the video section automatically. Camera/live video products retain their existing camera showcase. Draft and archived products are excluded. Both groups share the existing `/accessories` page (also available at `/led-accessories`), with headings grouping the current filtered, paginated results. There is no new accessory page.

The desktop More dropdown uses native details/summary so it can open without waiting for JavaScript. It supports keyboard operation and closes on Escape, outside clicks, leaving navigation focus, resizing and link navigation. Mobile retains its expandable More section.

Verification:

- `npm run typecheck`
- `npm run build`
- `node --import tsx --test tests/homepage-improvements.test.ts tests/homepage-settings-model.test.ts tests/homepage.test.ts tests/catalogue-redesign.test.ts`
- `node --import tsx tests/homepage-improvements.integration.ts` uses ephemeral MongoDB fixtures and Chrome. Covers authenticated form persistence/reload, public rendering, unchanged saved Hero wording, classification, both shared accessory URLs, six viewport widths, More navigation, keyboard handling, no-JavaScript desktop toggle and browser errors. Screenshots are written to `/private/tmp/igt-homepage-improved-*.png`.


## Video cards and sign-in follow-up

Video Accessories now uses dedicated image-and-description cards with full short descriptions, prices and individual product detail links. Product galleries remain available. The section always displays three cards: published accessories fill the available slots, and remaining slots show clearly labelled informational cards with image placeholders and catalogue links. Populate cards through Accessories using the Video accessory classification or an existing video category; the homepage settings page links to that workflow.

After a successful sign-in, the login form requests a fresh dashboard document so the browser cannot reuse a cached signed-out layout. Account credentials, session security and rate limits are unchanged. Verification includes an incorrect-password attempt followed by a successful login and dashboard reload, using an isolated account.

## Keyboard admin sign-in

The admin form now has a native POST destination in addition to its interactive submission handler. Pressing Enter while the page is still loading submits the credentials without placing them in the URL. The login route accepts form-encoded requests, retains the same validation, rate limit, password check and session cookie behavior, and redirects to the dashboard on success. Failed native submissions return to the login form with a visible error. The route rejects cross-origin submissions. Browser verification covers Enter after hydration, Enter without JavaScript, invalid credentials, a successful session and cross-origin rejection.
