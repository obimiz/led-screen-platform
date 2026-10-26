# Homepage, catalogue and Electronic Bell implementation report

## Scope and repository compatibility

The implementation extends the existing Next.js App Router application, Product and ProductCategory models, authenticated dashboard, MongoDB ProductImageAsset storage, BusinessSettings singleton, and Blog & Projects module. No product collection, media store, checkout, payment gateway, paid service, destructive migration, or production data seed was introduced. Nothing was committed, pushed or deployed.

The working tree already contained Blog & Projects implementation changes when this task began. Those changes were retained; their rich editor, safe renderer, cards and publication rules are reused here. The repository's installed Next.js layouts/pages guide was read before implementation.

## Completed functionality

- The homepage retains its large existing hero and presents four service offerings inside one full-width card, with service links and a quotation CTA.
- Subsequent sections follow the requested order: featured LED screens, digital bell, cameras/live video, accessories, featured projects, latest articles, clients, gallery and contact CTA. Bell and camera sections remain visible with explanatory content and enquiry links when there are no eligible featured products. Product cards still require real published records; LED screens retain their enquiry empty state.
- Accessory administration now supports persistent computer uploads, library selection, featured selection, multiple photographs, previews, replacement, removal, image order, alt text, prices, promotional prices, quotations, availability, publication, archive, SEO and editable slugs.
- Cameras use `showcase: "camera"` on existing `led-accessory` Product records. The same form, categories, API, public catalogue and detail routes serve them. The camera section includes the compatibility qualification requested by the business.
- Bell product creation/editing now loads saved values and supports category, descriptions, images, specifications, NGN prices/promotions, quote pricing, stock, publication, archive, homepage featuring, slug and SEO. Existing bell-specific fields are retained when editing.
- The Electronic Bell & Alarm page is backed by an editable settings record. Hardcoded product examples were removed; published Product records supply its showcase.
- A reusable compact PageHero is used on public catalogues, details and service/contact pages, including blog, projects, music and gallery. It supports title, description, optional real image/overlay, branded fallback and CTA. The homepage keeps its original large hero. Heroes are placed in public page components rather than the global admin/auth layout.
- Existing sticky navigation, selection-close behaviour, official WhatsApp links, client organisation marquee, gallery and public routes are retained.

## Administration routes

| Route | Purpose |
| --- | --- |
| `/admin/accessories` | Existing accessory and camera list |
| `/admin/accessories/new` | Extended product form; select accessory or camera classification |
| `/admin/accessories/[id]/edit` | Edit existing accessory/camera |
| `/admin/electronic-bell` | New page content editor, unsaved preview, draft save, publish and discard |
| `/admin/electronic-bell/preview` | Authenticated saved draft preview, excluded from indexing |
| `/admin/bell-alarm/products/new` | Extended bell product form |
| `/admin/bell-alarm/products/[id]/edit` | Load and update existing bell product |
| `/admin/product-categories?productType=bell-alarm-system` | Existing category manager extended to select a product classification |
| `/admin/accessory-categories` | Existing manageable accessory/camera categories |

The dashboard navigation links to the new page editor. New bell product administration links to category management.

## Public routes

- New `/accessories` and `/accessories/[slug]` aliases reuse the existing public catalogue and details. Existing `/led-accessories` URLs and canonical metadata are preserved.
- `/led-accessories` retains category/search filters, pagination, published-only records, responsive cards and empty state. Loading/error boundaries were added to both catalogue entry routes.
- `/electronic-bell-alarm` now renders published editable page settings and published bell products. Existing `/electronic-bell-alarm/products`, product details, accessories and request URLs remain.
- Existing LED screen, music, gallery, projects, blog, about, contact, testimonial and service/request pages use the shared compact hero, including shared catalogue/detail renderers where applicable.
- Transactional cart, checkout, payment and order pages keep their existing presentation. Authentication and normal dashboard pages do not receive public heroes. Explicit admin preview views can render the page being previewed.

## Database and monetary representation

Added optional/defaulted fields on the existing Product schema:

| Field | Default / role |
| --- | --- |
| `promotionalPrice` | `null`; discounted regular fixed price |
| `imageAlt` | Empty string; primary photograph description |
| `imageAlts` | Empty list; ordered additional photograph descriptions |
| `showcase` | `accessory`; optional `camera` classification |

The existing Product `slug`, `featured`, `status`, `category`, price and stock fields continue to serve every product type. Legacy accessories without a classification still qualify as accessories. No new indexes or collections are needed.

Added `bellPageDraft` and `bellPagePublished` subdocuments to the existing BusinessSettings singleton. Business identity/contact settings and other fields are preserved through `$set` updates. No records or images are deleted.

Prices retain the project's existing numeric major-unit product representation, with server validation restricting new amounts to safe, nonnegative, two-decimal values. New accessory/bell prices use NGN. Fixed prices require a numeric amount; quotation prices do not. Promotions require a regular fixed price and must be lower than it. Public pricing shows the regular price struck through beside the discount, while quote mode hides numbers. Currency formatting remains centralized through `Intl.NumberFormat("en-NG")`.

The application already had optional cart/order functionality. Its existing displayed unit prices and server-side order calculations now use the same valid discounted price; existing order conversion to minor units remains in place. No checkout or payment system was added.

## Image storage and security

Images are uploaded through the existing authenticated `/api/product-images` endpoint and stored as persistent MongoDB ProductImageAsset buffers. Files remain accessible through existing image URLs. Removing a product association preserves the underlying asset and other records using it.

The shared media manager supplies computer and library inputs, batch upload, previews, selection, alt text, replacement, removal and reordering. Accessory/bell forms enable automatic primary-image selection when uploading the first additional photograph. URL and alt arrays move together. Saving persists the actual image references.

Uploads enforce existing admin authentication, same-origin checks, PNG/JPEG/WebP type and signature checks, a streamed 4 MB size cap, and complete image decoding through Sharp with a 40-million-pixel limit. Sharp is now an explicit local dependency (already part of Next.js's image dependency tree). Invalid or missing Mongo image references are rejected on product/page saves. Existing external and local image references remain compatible. Product image rendering retains graceful failure handling.

Image assets retain the existing public catalogue-asset policy; the media library and uploads require authentication. This change does not introduce a private draft-media storage layer.

Product and page mutations enforce existing admin sessions, server validation and safe origins. Rich content uses the existing whitelist sanitizer and React renderer; raw HTML is not injected. Public queries require published status and cannot expose draft/archived products. Blog queries also retain the existing future-publication and project publication restrictions.

## Electronic Bell editing workflow

1. Open `/admin/electronic-bell` and edit the heading, subtitle, introduction, hero image/alt text, section heading, rich content, showcase text, featured/informational images, contact CTA and SEO fields.
2. Save Draft to persist pending edits without changing the published page.
3. Preview unsaved changes in the editor, or use the authenticated saved-draft preview route.
4. Publish Changes validates the complete payload and updates the live snapshot, then revalidates the public page/homepage.
5. Discard restores the last saved editor values, including the rich editor document.

Before the first publication, the page uses descriptions derived from the previous page rather than fabricated products. Page SEO uses the published snapshot for title, description and social sharing image.

## Homepage selection rules

| Section | Rule |
| --- | --- |
| LED screens | Published, existing `featured` flag; up to six |
| Digital bell | Published bell system with `featured` and an available image reference; most recently updated, then ID |
| Cameras | Published featured accessories classified as camera; most recently updated, then ID; maximum three |
| LED accessories | Published featured accessories excluding camera classification; missing legacy classifications remain eligible; maximum six |
| Projects | Existing published featured project query and administrative ordering |
| News & Insights | Published articles; featured first, then publication date, creation date and ID; maximum three |
| Clients/gallery | Existing featured/public organisation and gallery queries |

There is one existing product `featured` flag. Changing it or publishing a qualifying product requires no source-code edit. Bell and camera headings and enquiry links remain visible even when their product lists are empty; the accessory showcase remains conditional. No empty showcase invents business records.

## Files created

- `src/components/layout/page-hero.tsx`
- `src/components/content/bell-page-editor.tsx`
- `src/components/content/bell-page-view.tsx`
- `src/lib/validations/bell-page.ts`
- `src/lib/media/validate-references.ts`
- `src/services/bell-page.ts`
- `src/app/api/electronic-bell/route.ts`
- `src/app/(admin)/admin/electronic-bell/page.tsx`
- `src/app/(admin)/admin/electronic-bell/preview/page.tsx`
- `src/app/(public)/accessories/page.tsx`
- `src/app/(public)/accessories/[slug]/page.tsx`
- `src/app/(public)/accessories/loading.tsx`
- `src/app/(public)/accessories/error.tsx`
- `src/app/(public)/led-accessories/loading.tsx`
- `src/app/(public)/led-accessories/error.tsx`
- `tests/catalogue-redesign.test.ts`
- `tests/catalogue-redesign.integration.ts`
- `docs/homepage-catalogue-redesign.md`

## Existing files extended

- `package.json`, `package-lock.json`: explicit Sharp dependency and catalogue test commands; prior publishing dependencies retained.
- `src/models/product.ts`, `src/models/business-settings.ts`: additive defaults and page snapshots.
- `src/types/product.ts`, `src/lib/validations/product.ts`: product fields, media URLs, NGN/discount/precision/slug validation.
- `src/lib/utils/product-price.ts`, `src/components/products/price-display.tsx`: effective price and promotional presentation.
- `src/services/products.ts`, `src/services/bell-alarm.ts`, `src/services/portfolio.ts`: media validation, persistence, revalidation, deterministic featuring and article query.
- `src/services/orders.ts`: existing orders use the same configured promotional price.
- `src/app/api/products/route.ts`, `src/app/api/products/[id]/route.ts`: safe origins and media validation errors.
- `src/app/api/product-images/route.ts`: image decode/integrity validation.
- `src/app/api/product-categories/route.ts`: category queries support existing bell classifications.
- `src/components/forms/accessory-form.tsx`, `src/components/bell-alarm/product-form.tsx`: complete persistent product workflows.
- `src/components/products/category-manager.tsx`: strip DTO-only fields when editing categories.
- `src/components/products/accessory-card.tsx`, `src/components/products/product-card.tsx`: descriptions, alt text, safe fallback and consistent displayed prices.
- `src/components/publishing/media-manager.tsx`: reusable product limits and automatic primary-image selection.
- `src/components/publishing/catalogue.tsx`, `src/components/publishing/detail.tsx`, `src/components/music/catalogue.tsx`: shared public heroes; normal admin article previews keep their own heading.
- `src/lib/constants/navigation.ts`: page editor entry.
- Existing admin bell create/edit and product-category pages: category access and loaded product values.
- Public homepage and Electronic Bell page: data-connected redesign.
- Public about/contact, LED screen/accessory details/catalogues, gallery, music subpages, project pages, services and service/request/testimonial pages: shared hero adoption and consistent compact headings. Existing routes and content continue to render.

## Owner setup and operational limits

No live inventory or production photographs were added or replaced. Production inventory was not audited, so this report does not claim that any particular real item or photograph is missing.

For any showcase without product cards, add genuine product records and photographs in the existing dashboard, publish them and enable Featured. Select Camera / live video on camera records. Bell categories can be created through the existing product category manager before adding a bell product. Review and publish the bell page settings when ready.

External image URLs retain their existing availability dependency. Previously saved broken URLs may still require the owner to replace their association; stored image files are not deleted or repaired destructively. Browser viewport testing does not constitute physical-device testing.

## Validation results

Final validation results are recorded below after the isolated test run.

- `node --import tsx --test tests/*.test.ts`: **68 passed, 0 failed**. Includes the new catalogue validation tests and existing sales, rental, maintenance, music, gallery, orders, contact, homepage, publishing, security and SEO tests.
- `npm run typecheck`: **passed**.
- `npm run build`: **passed**, including production compilation, TypeScript, prerendering and route generation.
- `npm run lint`: **0 errors, 36 pre-existing warnings, 0 new warnings**. The warning-bearing files were checked against their original `HEAD` contents through ESLint stdin: the same 36 warnings were reproduced. They concern existing unused suppression directives/variables and existing raw image elements. No unrelated warning cleanup was applied.
- `git diff --check`: **passed**.

The production build reads the existing environment file without modifying it. All database writes used by integration tests target ephemeral MongoDB instances with synthetic test-only fixtures. Local-port/browser tests require the approved execution outside the filesystem/network sandbox.

- `npm run test:catalogue:integration`: **15 checks passed** against an isolated production server and disposable MongoDB. Checks cover authentication, corrupt uploads, actual stored image bytes, accessory/camera/bell persistence, draft/live separation, preview, publication, browser form upload and first-image selection, bell editing, homepage ordering, featured article priority, hero/H1 counts on main catalogue/detail routes, mobile/tablet/desktop overflow, navigation, WhatsApp, preservation of an existing LED product, archived/draft visibility and browser runtime exceptions.
- `npm run test:homepage:integration`: **11 checks passed**, including existing organisation administration and record preservation, all supplied client names, six browser widths, image fallback, reduced motion, pricing/quote navigation, idempotent seeding and database-outage behaviour. The legacy section-order assertion was updated to the requested homepage order.
- Mobile (390 px) and desktop (1440 px) full-page screenshots were inspected; the new suite also checks a 768 px tablet viewport. Existing homepage checks cover 375, 430, 768, 1024, 1280 and 1440 px. These are browser viewport tests, not physical-device verification.

Test harnesses now accept `IGT_TEST_BROWSER` for a local installed browser. The catalogue suite uses Microsoft Edge by default on this machine because a Chrome launch stalled; no production browser configuration is changed. Selectors exclude Next.js's hidden streaming copies of controls. The installed Next.js documentation confirms that a streamed `notFound()` may return HTTP 200; archive checks assert absent product content and `noindex`, in addition to persisted archive state.

Additional existing test files updated for the requested changes: `tests/homepage.integration.ts` and `tests/publishing.integration.ts` (section order, shared upload label and visible streaming-result selectors).

- Existing `tests/publishing.integration.ts`: **10 checks passed** against the final production build. Covers real admin login, scoped categories, article/project rich content and images, draft preview, permission-gated publication, SEO, filtering, homepage integration, photo reordering/lightbox, client privacy, editing preservation, desktop/tablet/mobile layouts, dropdowns, unpublishing/archiving, sitemap exclusion, deletion preserving media, pagination and unchanged business fixtures.
- The Electronic Bell page retains service JSON-LD using its published heading and introduction, as well as editable page/social metadata.

**Final result:** no known new functional failures in the automated and browser checks above. Remaining repository issues are the 36 verified pre-existing lint warnings, the existing public-media visibility policy, and the external/legacy image availability limitations noted above. No physical device or production deployment verification is claimed.

## Follow-up: homepage section visibility and service heroes

The Electronic Digital Bell Systems and LED Screen Cameras & Live Video Solutions sections now remain visible without featured inventory. The bell section uses a branded bell icon when no eligible product photograph exists; the camera section retains its compatibility explanation and enquiry CTA without invented cards. Eligible published featured records still populate the sections automatically.

Installation, rental and maintenance pages now use one standalone PageHero containing the original description and enquiry actions, replacing the previous nested hero inside an older banner. Regression checks cover empty-inventory section visibility and standalone service heroes.

Follow-up validation: 8 focused unit tests, 16 catalogue/browser integration checks (including empty inventory and standalone installation/rental/maintenance heroes), and all 11 homepage regression checks passed. Production build and TypeScript passed. ESLint remains at 0 errors and the same 36 pre-existing warnings. The additional specific page mentioned in the follow-up has not yet been identified by name or URL.

## Follow-up: prominent blog and main navigation

The main navigation now explicitly lists Home, LED Screens, Accessories, Music, Blog, About and Contact. LED Installation is in More alongside maintenance, bell/alarm, projects, gallery and services. The duplicate text quote link was removed; the existing red quotation CTA remains. Mobile navigation uses the same primary links and an expandable More group. The full desktop row starts at 1280 px to keep all requested links readable on narrower screens. The former Solutions anchor now points to the existing Services page.

The homepage Blog section is always present, with its existing featured-first published article cards and View All Articles action. When there are no published articles, it displays an honest empty state and the blog link. Publication/draft/archive filters and existing article records are unchanged.

Files updated for this follow-up: `src/lib/constants/navigation.ts`, `src/components/layout/header.tsx`, `src/components/layout/mobile-navigation.tsx`, `src/app/(public)/page.tsx`, and relevant navigation/browser assertions in `tests/catalogue-redesign.integration.ts` and `tests/publishing.integration.ts`.

Navigation/blog follow-up validation: production build and TypeScript passed; 8 focused unit tests and 17 isolated browser/integration checks passed. Browser checks verify prominent Music/Blog/About/Contact links, only one quotation CTA, installation under More on desktop and mobile, menu closing, and layout widths from 390 to 1440 px including 1024 and 1280 px. ESLint remains at 0 errors and 36 verified pre-existing warnings.

## Follow-up: bell navigation and owner-selected homepage photos

Electronic Bell & Alarm now replaces Music in the primary navbar; Music replaces it in More. The same grouping is used on mobile.

`/admin/settings/homepage` adds two photo controls inside the existing dashboard: Electronic Bell homepage photo and LED Screen Camera homepage photo. Each supports computer upload, existing-library selection, immediate preview, alt text, replacement/removal, save and discard. Images use the existing authenticated upload/library endpoints and MongoDB ProductImageAsset store. The settings API validates session, origin, image URLs and stored references before saving.

Four fields (`bellImageUrl`, `bellImageAlt`, `cameraImageUrl`, `cameraImageAlt`) are stored under `homepageImages` on the existing BusinessSettings singleton. This adds no collection, product record or storage system. Saved manual photos take precedence over featured-product photographs and remain usable without published products. Removing a manual selection restores automatic product photography if available; stored files remain intact.

Both homepage sections now use an image-and-text layout: side by side from tablet/desktop widths and stacked on phones. The camera's automatic leading product uses the same layout, with remaining featured cameras below it. Product publication/featuring rules remain in effect for those product records. Manually selected section photographs do not display unrelated product names.

New files: `src/lib/validations/homepage-images.ts`, `src/services/homepage-images.ts`, `src/app/api/settings/homepage-images/route.ts`, `src/components/home/homepage-images-form.tsx`, `src/app/(admin)/admin/settings/homepage/page.tsx`. Existing navigation, ProductImagePicker, BusinessSettings and homepage files were extended. No photographs or inventory were invented or added to production; the owner can select their real images in Homepage Images.

Photo/navigation follow-up validation: production build, TypeScript and 12 focused unit tests passed. All 19 isolated browser/integration checks passed, including distinct computer uploads for the two homepage photos, saved references and alt text surviving reload, actual image decoding/loading, side-by-side desktop geometry and stacked mobile geometry, removal without asset deletion, existing-library reselection, and manual photo visibility after products are unpublished. Electronic Bell & Alarm is verified in the primary navbar and Music in More on desktop/mobile. No production images or records were changed during testing.

## Follow-up: four accessory cards on the homepage

The LED Screen Accessories section now remains visible and displays up to four published, featured LED accessories from the existing Product records. Its compact cards contain the stored product photograph, name, short description, configured price/quotation text and a red Read More link to `/accessories`. Product names still link to their individual details. The grid displays one card per row on phones, two on tablets and four on larger screens, with aligned actions. Cameras, drafts and archived records are excluded by the existing query.

Owners choose the products through `/admin/accessories` using the existing Published and Featured controls. If fewer than four eligible records exist, the page displays only actual eligible records; when none exist, the section and catalogue link remain visible without fabricated cards. Existing full catalogue cards and their actions are unchanged.

Accessory-card follow-up validation: production build, TypeScript and all 20 isolated browser/integration checks passed. The new check seeds five eligible test-only accessories and verifies that exactly four appear, each has a stored image and description, every Read More action points to `/accessories`, navigation reaches the catalogue, and draft/archived accessories and cameras are excluded. Responsive overflow checks continue to pass. ESLint remains at 0 errors and 36 pre-existing warnings; existing Mongoose update-option deprecation messages are unrelated to these display changes.

### Accessory card visibility follow-up

The homepage now fills up to four accessory cards from published non-camera accessories, prioritising featured records and then the most recently updated products, with ID as a stable tie-breaker. Draft and archived records remain excluded. Each card retains its photograph, description, pricing and Read More link to `/accessories`. The connected catalogue was inspected read-only and contained no accessory records; the owner must add and publish real accessories with photographs in the existing admin before product cards can appear. No business records were created or changed.

Verification for this follow-up: TypeScript and production build passed; 12 focused unit tests and 20 isolated integration checks passed, including four cards with featured-first ordering and published non-featured fallback. ESLint completed with zero errors and the 36 previously recorded warnings. No physical-device testing or deployment was performed.

### Visible accessory cards with an empty catalogue

The empty accessory section now renders four clearly labelled informational accessory-type cards with branded icons, descriptions and Read More links. Published catalogue records automatically replace them with real product cards. No invented products, photographs, prices or inventory records were added. See `docs/bell-alarm-category-fix.md` for the related category-management fix and final validation: production build and TypeScript passed, 12 focused unit tests and 21 isolated integration checks passed, and ESLint reported zero errors with 36 existing warnings.

### Cameras managed as an accessory category

Cameras remain under LED Accessories in the existing dashboard. The separate camera sidebar entry and camera-specific form/list presentation have been removed. A real active LED Screen Cameras category (`led-screen-cameras`) was added to the existing ProductCategory collection using an insert-only, repeatable script (`scripts/ensure-camera-category.ts`). Existing records and images were left unchanged. The regular accessory seed also includes this category for future environments.

Choose LED Accessories → New accessory → Category: LED Screen Cameras. Selecting this category automatically sets the existing homepage classification to Camera / live video. Upload photographs, enter the product details, publish and mark Featured to show the camera in the homepage live-video section. The owner can edit, activate and order the category through Accessory Categories.

Validation: TypeScript and targeted ESLint passed; six catalogue unit tests passed. No commit, push or deployment was performed.
