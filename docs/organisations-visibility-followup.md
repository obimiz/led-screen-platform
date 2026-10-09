# Organisation visibility follow-up

The database blocker recorded below was resolved in the subsequent [organisations verification](organisations-verification.md). All ten records and existing logo assets were verified; their URL casing was corrected without changing other database fields. The current marquee uses one scrolling row.

## Diagnosis

The existing `ClientOrganisation` model, protected organisation APIs, admin manager, seed script and CSS marquee were already implemented. `src/app/(public)/page.tsx` imports and renders `OrganisationMarquee` immediately after the hero and before the unchanged Services and Featured Catalogue sections.

The public service filters only `active: true, featured: true`; it never filters by logo. `OrganisationMarquee` returns null for an empty list. The homepage also substitutes an empty list when the database query rejects. The previous task explicitly left application-database seeding unexecuted.

In this follow-up the configured MongoDB connection failed with `MongooseServerSelectionError`, including an unrestricted connection attempt and a 30-second timeout retry. The URI is configured and has a valid MongoDB scheme; its value was never printed. Therefore the actual collection count and visibility flags cannot be confirmed. `npm run seed:organisations` was attempted against the configured database and failed to connect. It did not report any inserted records. No database users, network settings or credentials were modified.

## Changes

- Reused the existing module; no duplicate model, API or component.
- Added the requested OUR CLIENTS eyebrow to the marquee.
- Normalised null logo/location/website fields to empty strings in the existing service so legacy/null records remain safe for public display and admin editing.
- Explicitly allowed null logo references in the logo component; missing or failed images retain the existing initials fallback.
- Added `scripts/inspect-organisations.ts`, a read-only diagnostic listing organisation names and visibility flags without credentials or asset URLs.
- Extended the existing integration test to seed the ten supplied names, verify null-logo handling, exact section order, and all six viewport widths in a browser.

The existing slow opposing desktop rows, single mobile row, hover/focus/touch pause, pause checkbox and reduced-motion wrapping remain intact. Organisation names stay HTML text and remain independent of all portfolio media.

## Remaining dependency

Restore access to the configured database, then run:

```sh
node --import tsx scripts/inspect-organisations.ts
npm run seed:organisations
node --import tsx scripts/inspect-organisations.ts
```

The idempotent seed inserts only missing supplied records with active and featured true, blank logo references, and stable display order. It preserves existing records and manual changes. Once connectivity is restored, verify the actual homepage displays all intended active/featured records.

Add supplied official logo files under `public/images/clients/`, then set each `/images/clients/filename.png` reference in Admin → Organisations. No official logo assets were found; only the folder README exists.

## Verification results

- Configured-database browser check: HTTP 200, zero uncaught browser errors, no horizontal overflow, but zero organisation sections. Live activation remains blocked by database connectivity.
- Isolated browser suite: 11 check groups passed. All ten supplied names rendered without logos in exact Hero → Organisations → Services → Featured Catalogue order at 375, 430, 768, 1024, 1280 and 1440px. No hydration/uncaught browser errors in those checks.
- Lint: passed, 0 errors and 52 warnings.
- Typecheck: passed.
- Unit tests: 42 passed, 0 failed.
- Build: passed.
- `git diff --check`: passed.
- Git status: existing dirty workspace retained, 62 tracked changes and 145 untracked entries. No commit or push.

Do not mistake the successful isolated seed for a successful application-database seed. The latter remains incomplete.
