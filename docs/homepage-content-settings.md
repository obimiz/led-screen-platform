# Product Management supplies all Bell and Camera homepage content

## Homepage behavior

Published featured products are the only source for the Bell and Camera product headings, short descriptions and photographs. The selected product's name is rendered directly as the section H2; no separate section heading or duplicate product-name H3 is shown. Each section displays one summary. The featured photograph is used first, with the product's additional photographs as fallback and matching alt text. The lead camera is excluded from the additional camera cards.

The existing selection rules remain: published featured Bell products and cameras are ordered by most recently updated with stable ID tie-breaking. Draft, archived and non-featured products do not become the selected homepage product. The existing side-by-side desktop and stacked mobile layouts, 4:3 contain fitting, CTAs and detail links remain.

Missing featured products use the existing safe generic section headings and one fallback message. Selected products without photographs retain their own headings and summaries beside a branded placeholder. No fictional products or inventory are created.

## Admin and retired settings

The existing `/admin/settings/homepage` route is now an informational **Homepage Content** page linking to Bell Product Management and LED Accessories for cameras. It has no duplicate heading, description, photo-upload or image-override fields. Owners edit product names, short descriptions and photographs in the existing product forms and use Published/Featured to select homepage content.

The obsolete form, settings reader and validation module were removed. The duplicate `homepageImages` path was removed from the active BusinessSettings schema. Historical stored values are left untouched and are never queried or rendered by the homepage. The retired `/api/settings/homepage-images` PUT endpoint retains existing authentication and same-origin protection, then returns 410 with product-management guidance without writing any record. This prevents stale forms from reintroducing overrides.

No product models, product records, media assets or media associations were deleted or migrated. No new collection or storage service was introduced.

## Implementation

- Added `src/lib/utils/homepage-product.ts` for product-only presentation and safe fallback handling.
- Updated homepage rendering, the existing admin guidance page, sidebar wording, the retired settings endpoint and BusinessSettings schema.
- Removed `src/components/home/homepage-images-form.tsx`, `src/services/homepage-images.ts` and `src/lib/validations/homepage-images.ts`.
- Updated focused unit and isolated admin/public integration checks.

## Verification

TypeScript and 14 focused unit tests passed. ESLint completed with zero errors and 36 previously recorded warnings. Production build and all 28 isolated integration checks passed. Browser checks verify the field-free admin guidance page, rejection of stale settings writes, unchanged records, product names used as H2 headings with one summary, product-driven images despite historical overrides, updates flowing from Product Management, missing-photo placeholders and safe no-featured-product fallbacks. Responsive photo/text layouts passed at 390, 1280 and 1440-pixel widths. Existing catalogue, media, navigation and publishing regression checks passed with no client runtime exceptions. `git diff --check` passed.

Tests use disposable MongoDB records and browser viewports. Physical devices were not tested. No production records were changed. No commit, push or deployment was performed.


## Editable accessories section introduction

The homepage LED Screen Accessories heading and description were previously hardcoded. They are now editable at Dashboard → Homepage Content → LED Screen Accessories section (`/admin/settings/homepage`) through Accessories section heading and Accessories section description. The existing text is retained as the default for older records or unavailable settings.

The fields persist under `BusinessSettings.homepageAccessories` through the authenticated, same-origin-protected `/api/settings/homepage` PUT endpoint. The endpoint validates required trimmed headings (maximum 160 characters) and descriptions (maximum 2000 characters) and updates only this settings object. It revalidates the homepage and admin route. Product content, photographs, featured selection and Bell/Camera product-only behavior remain unchanged. Saved text is rendered as plain React text in the same homepage layout, with long-word wrapping. Discard changes restores the last saved values.

Added constants, validation, a settings reader, API route and admin form scoped to accessory section copy. TypeScript and 16 focused unit tests passed; ESLint reported zero errors and 36 existing warnings. Production build and all 29 isolated integration checks passed. Tests verified the original defaults, edits through the admin form, MongoDB persistence and reload, discard behavior, required-field and unknown-field validation, authentication and same-origin protection, literal safe rendering, three accessory cards and the catalogue link at 390, 1280 and 1440-pixel widths. Product records, legacy settings, business identity and Bell/Camera product-only rendering remained intact. `git diff --check` passed.

## Editable homepage hero write-up

The homepage hero heading and description were previously hardcoded. They are now editable under Dashboard → Homepage Content → Homepage Hero (`/admin/settings/homepage`) using Hero heading, Hero description and Save hero. The original “Professional LED Display Solutions” heading and introductory sentence remain the defaults for existing records. The business-name eyebrow remains managed by Business Settings.

Hero text persists under `BusinessSettings.homepageHero` in the existing singleton record. The existing homepage settings endpoint handles hero changes through PATCH while its existing PUT accessory workflow remains compatible. Each operation updates only its own section and revalidates the homepage and admin route. Both forms share rendering and validation logic, and both sections load through one settings query. Blank/oversized input is rejected; headings are capped at 160 characters and descriptions at 2000. Text is rendered as plain React text; description line breaks are preserved. Saved edits and discard behavior are independent between the forms.

The hero background, video, branding, two CTA buttons and responsive layout remain intact. Bell/Camera product-only content and all product/media records are unchanged. No additional collection or service was introduced.

Verification: TypeScript and 17 relevant unit tests passed. ESLint reported zero errors and 36 existing warnings. Production build and all 30 isolated integration checks passed. The browser suite confirmed hero defaults, editing through the admin form, MongoDB persistence, reload and discard behavior, unauthorised/cross-origin/invalid input rejection, independent accessory saves, safe plain-text rendering, unchanged CTA destinations and responsive layouts at 390, 1280 and 1440-pixel widths. Existing products and retired overrides remained unchanged. No client runtime exceptions were observed. `git diff --check` passed. No commit, push or deployment was performed.

## Save persistence correction

A regression test reproduced an older cached Mongoose BusinessSettings model silently dropping the newly added homepage fields during strict update casting. The model now registers missing homepage schema paths on the existing cached model, preserving its identity and all existing records. The save endpoint verifies the returned stored heading and description before reporting success, and returns the persisted copy to the form. Successful saves refresh the admin route; each form also provides a View saved homepage link.

Verification: 18 focused unit tests, TypeScript and the production build passed. ESLint completed with zero errors and the existing 36 warnings. All 31 integration checks passed against the fresh production build using isolated MongoDB data, including a cached-model persistence regression and browser saves/reloads/public hero checks. An earlier integration attempt overlapped the build and failed during navigation; the full suite was rerun successfully after the build completed. No business records were edited for testing. Physical devices were not tested. No commit, push or deployment was performed.

## Two independent Hero message paragraphs

Homepage Content → Homepage Hero now includes optional Hero message paragraph 1 and Hero message paragraph 2 fields, separate from the existing required heading and description. Each supports up to 2000 characters and preserves internal line breaks. Empty messages are omitted publicly; older records default to empty messages without changing existing copy. Nonempty messages appear as separate, spaced paragraphs after the description using the existing responsive typography, wrapping and text colours.

Both fields persist in the existing BusinessSettings.homepageHero object through the authenticated PATCH endpoint and participate in stored-value verification, form reload and discard. The cached-model compatibility handling also registers the new fields on already-compiled settings models. Plain React text rendering prevents message markup from executing. No migration, additional collection, product change or media change is required.

Verification: 19 focused unit tests, TypeScript, production build and all 31 isolated integration checks passed. Browser tests saved distinct multiline messages, checked MongoDB values, reloaded both inputs, discarded unsaved edits and verified separate safely rendered paragraphs with preserved line breaks at 390, 1280 and 1440-pixel widths. Existing description, accessory settings and product data remained intact. ESLint reported zero errors and 36 existing warnings. The initial browser run reached an outdated four-field count assertion; updating it to six allowed the full suite to pass. Physical devices were not tested. No commit, push or deployment was performed.

## Two Hero headings replace message paragraphs

Homepage Content → Homepage Hero now presents Heading 1, optional Heading 2 and the existing Hero description. Heading 1 reuses the saved `homepageHero.heading` field, preserving the current title. Heading 2 persists as `homepageHero.headingTwo`, defaults to empty and accepts up to 160 characters. The two heading lines render as block spans within one responsive H1 above the unchanged description, preserving a single primary heading and the existing background/buttons.

The former message paragraph controls and public paragraphs are removed. Stored messageOne/messageTwo values are left untouched: saves now update individual active settings paths rather than replacing the complete object, and reads explicitly select active Hero fields before validation. Retired message inputs are rejected by the endpoint. Existing heading and description defaults, stored-value verification, refresh, discard, authentication and same-origin protections remain in place.

Verification: 19 focused unit tests, TypeScript, production build and all 31 isolated integration checks passed. Browser checks verified both headings save, reload, discard and render on separate lines before the existing description at 390, 1280 and 1440-pixel widths, with exactly one H1 and no former message paragraphs. Legacy message text was injected into disposable settings records and confirmed preserved after saves; it did not prevent settings loading. Existing accessory settings, products, photographs and CTA links remained intact. ESLint completed with zero errors and the existing 36 warnings. `git diff --check` passed. Physical devices were not tested. No commit, push or deployment was performed.
