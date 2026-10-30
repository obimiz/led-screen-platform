# Bell & Alarm categories and homepage accessory cards

## Category fix

The existing ProductCategory model, shared category APIs and CategoryManager already support `bell-alarm-system` and `bell-alarm-accessory`. The default category page displayed LED categories without offering type navigation, and the bell form showed an empty dropdown with no useful next step. No replacement category model, collection or migration was needed.

- `/admin/product-categories` now offers clearly labelled navigation for LED screens, LED accessories, Bell & Alarm systems, and Bell & Alarm accessories. The existing editor handles creation, edits, activation and numeric sort order independently per type.
- The admin sidebar includes **Bell & Alarm Categories**, linking through `/admin/bell-alarm/categories` to the shared manager filtered to `bell-alarm-system`.
- Bell create/edit pages load active categories of the matching product type. The form uses actual category IDs as option values, supplies a Create Category link and helpful empty state, and disables saving when no active category exists.
- Bell product DTOs serialize category references as strings. Server create/update operations require the selected category to exist, be active and match the product type. Creation no longer silently substitutes another category for an invalid choice.
- Existing LED/accessory categories and stored images are untouched. No live business records were created, updated or deleted. A Horn Speaker used for testing exists only in the disposable integration database.

## Homepage accessory cards

The earlier homepage rendered no cards when no published accessory records existed. It now shows four informational accessory-type cards in that case: LED Modules, Video Processors, Receiving Cards & Controllers, and Power Supplies & Connections. These have branded icons, descriptions and Read More links to `/accessories`. They are labelled accessory types and make no inventory or price claims.

When published accessories exist, the homepage uses their real photographs and descriptions, up to four cards, with featured records first and then recently updated records. Drafts, archived records and camera products remain excluded. The owner can replace the informational cards by adding and publishing actual accessories with photographs through the existing admin.

## Files

Created:

- `src/app/(admin)/admin/bell-alarm/categories/page.tsx`
- `src/components/products/accessory-type-cards.tsx`
- `docs/bell-alarm-category-fix.md`

Updated for this fix:

- `src/lib/constants/navigation.ts`
- `src/app/(admin)/admin/product-categories/page.tsx`
- `src/app/(admin)/admin/bell-alarm/products/new/page.tsx`
- `src/app/(admin)/admin/bell-alarm/products/[id]/edit/page.tsx`
- `src/components/bell-alarm/product-form.tsx`
- `src/services/bell-alarm.ts`
- `src/app/(public)/page.tsx`
- `tests/catalogue-redesign.integration.ts`

## Verification

TypeScript and the production build passed. All 12 focused unit tests and 21 isolated integration checks passed. The browser workflow created a Bell category, edited its activation and order, selected it for a Horn Speaker, uploaded a featured image, saved a draft and published the product while preserving the category ID and image. API checks rejected wrong-type, inactive and nonexistent categories and verified failed updates did not alter the saved category or image. Homepage checks covered four informational cards without products and four product cards with featured-first ordering. ESLint completed with zero errors and 36 previously recorded warnings.

No commit, push or deployment was performed. Browser viewport tests do not constitute physical-device verification.
