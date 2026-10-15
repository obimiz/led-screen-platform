# Product upload display fix

## Root cause and record audit

For `Event & Stage LED Screen` (`6ac0fd4b6b49322acacddf56`), the upload was persisted correctly as `/api/product-images/6ad0cabd18acf4c81cff7b2e` and saved in `imageUrls`. Its `featuredImageUrl` was empty. Admin details, public product details and product cards read only `featuredImageUrl`, so the additional image never became the primary image. The upload picker previously required a separate assignment button after upload, making it possible to save without selecting a featured image.

The PNG exists in the existing ProductImageAsset collection, has a valid PNG signature, and serves anonymously with HTTP 200, `Content-Type: image/png` and 329,746 bytes. This was an association/rendering problem rather than missing storage, authentication, Next Image optimization, HTTPS or URL resolution. The other five LED products have neither featured nor additional image references; their empty image state is expected.

## Changes

- Automatically select an uploaded image as featured when the form has no featured image. With an existing featured image, add the upload to the additional gallery without replacing the selected main image. Keep explicit library assignment/replacement buttons and clear save instructions. If the gallery is full, retain the upload in the library and explain how to replace the featured image.
- Resolve product display images consistently: explicit featured image first, otherwise the first additional image. Deduplicate additional thumbnails without altering stored associations.
- Use that resolution on admin product details, public details, product cards and the homepage’s existing product cards. Respect the saved image fit setting on admin details.
- Repair only the reported product’s `featuredImageUrl` to reference its already saved PNG. An atomic condition guarded against concurrent changes. A before/after equality check verified its gallery, timestamps, prices, descriptions and every other field were unchanged. No other product or image was modified.
- Retain the existing upload endpoints, storage model and product-save cache invalidation. LED product saves already invalidate the catalogue, product detail, admin list and homepage. These pages query their data dynamically.

## Files changed for this task

- `src/lib/media/product-primary-image.ts` — shared display selection helper.
- `src/components/products/product-image-picker.tsx` — automatic upload assignment and feedback.
- `src/components/forms/product-form.tsx` — pass current featured/gallery state to the picker.
- `src/components/products/product-card.tsx` — catalogue/homepage fallback.
- `src/app/(public)/led-screens/[slug]/page.tsx` — primary fallback and deduplicated additional images.
- `src/app/(admin)/admin/products/[id]/page.tsx` — primary fallback and saved image fit.
- `tests/product-images.test.ts` — featured precedence, additional-image fallback and deduplication.
- `tests/led-catalogue.integration.ts` — gallery-only reproduction across all display locations and automatic upload assignment before saving.
- `scripts/inspect-product-image.ts` — read-only association/storage inventory.
- `scripts/repair-product-featured-image.ts` — guarded, idempotent repair limited to the reported product and asset.
- `scripts/verify-product-image.browser.ts` — read-only verification of the real repaired product against the local application.
- This report.

Existing uncommitted gallery/product work was preserved; unrelated modules were not changed for this fix.

## Verification

- The real uploaded PNG was decoded and visually inspected.
- Read-only browser verification of the affected product passed for admin detail, public catalogue, public detail, homepage and persisted featured-image value in the edit form. A final comparison verified that the browser checks did not modify the product.
- Relevant unit tests: six passed.
- TypeScript: passed.
- Production build: passed.
- ESLint: zero errors; 50 existing warnings, primarily raw image elements and unused lint suppressions/serializer variables.
- Isolated Product Management regression: all 10 reported groups passed, including the exact gallery-only/empty-featured reproduction on all four display locations, additional thumbnails, automatic featured assignment on upload, draft/publish/save, library replacement/removal, mobile/tablet/desktop layouts, homepage featuring, archive history, authentication, file validation and HTTPS reverse-proxy behaviour. The image checks scroll lazy-loaded images into view before waiting for decoding.

Commands:

```sh
node --import tsx --test tests/product-images.test.ts tests/led-catalogue.test.ts
npm run lint
npm run typecheck
npm run build
node --import tsx tests/led-catalogue.integration.ts
node --import tsx scripts/verify-product-image.browser.ts
```

The integration suite uses ephemeral MongoDB and disposable products behind a local HTTPS reverse proxy. It never uses genuine records. The live browser utility reads the configured database and localhost application, creates only a short-lived session token, and performs no business mutations. Logs and screenshots are in `/private/tmp/product-image-*`.

No commit, push or deployment was performed. The targeted data repair is already in the configured database. Source changes remain local for a later authorised release; no upload service or storage migration is needed.
