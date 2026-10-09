# Organisations verification

## Database and assets

Atlas connectivity succeeds outside the Codex sandbox, including the TCP check and application Mongoose query. Inside the sandbox the connection returns ECONNREFUSED. No credentials were printed and no database configuration was changed.

The application database contains exactly ten organisations, each expected name exactly once. All are active and featured, with display order 0–9 in the order below. No seeding or duplicate removal was necessary.

The filesystem directory is `public/Images/clients/`. macOS accepts its lowercase spelling, but Next's static URL lookup does not: `/images/clients/madonna-university.png` returned 404 while `/Images/clients/madonna-university.png` returned 200. The existing idempotent updater now uses the actual directory casing and skips already-correct records.

All ten saved logo URLs now use `/Images/clients/` plus these filenames:

| Organisation | Filename |
| --- | --- |
| Divine Mercy Catholic Church, Lekki | divine-mercy-lekki.png |
| Catholic Church of the Transfiguration, Lekki | transfiguration-lekki.png |
| St. Patrick, Alaba International | st-patrick-alaba.png |
| Holy Family Catholic Church, Festac | holy-family-festac.png |
| Catholic Church of the Visitation, Festac | visitation-festac.png |
| St. Mary's, Isolo | st-marys-isolo.png |
| St. Michael Catholic Church, Okpanam | st-michael-okpanam.png |
| Madonna University | madonna-university.png |
| Glorious Praise | glorious-praise.png |
| Affable Homes | affable-homes.png |

The updater compared full before/after records and verified that only logoUrl changed: IDs, names, slugs, timestamps, visibility flags, display order, and other fields were preserved. A second execution verified the same mappings without further updates.

## Repeatable local commands

From the repository root:

```sh
node --env-file=.env.local --import tsx scripts/inspect-organisations.ts
node --env-file=.env.local --import tsx scripts/update-organisation-logos.ts
```

The inspection now reports exact expected-name counts and local logo paths without printing credentials or external asset URLs. The updater requires exactly one record for every expected name before writing anything, verifies that each local asset exists, and checks for concurrent logo changes.

For read-only browser verification against a running production server:

```sh
npm run start -- -p 3136 -H 127.0.0.1
# In another terminal:
node --import tsx tests/organisations.browser.ts
```

An alternative origin can be supplied with ORGANISATIONS_TEST_URL. The browser check verifies all ten expected names in their existing order, loaded logos, one row, animation movement and loop continuity, contained images and names, compact card dimensions, bold names, pause control, reduced motion and uncaught browser errors. Screenshots are written to `/private/tmp/organisations-verified-{width}.png`.

No organisation UI rebuild, unrelated homepage edits, commit or push was performed.

## Verification results

- Atlas-backed browser: passed at 375, 430, 768, 1024, 1280 and 1440px; all ten logos loaded, single continuously scrolling row, seamless loop, contained logos/names, bold text, no page overflow, pause/reduced-motion behavior, and no uncaught browser errors. Mobile and desktop screenshots were also visually inspected.
- Homepage integration: all 11 check groups passed against an isolated database, including protected APIs, CRUD, filtering, ordering, seed idempotency, missing-logo fallback, section order, six widths and database-outage fallback.
- Unit tests: 45 passed, zero failures.
- Lint: zero errors, 53 existing warnings.
- Typecheck: passed. An initial run overlapped the build's regeneration of `.next/types` and reported missing generated files; the sequential rerun passed.
- Production build: passed.
- `git diff --check`: passed.

The browser geometry check rounds card dimensions to whole pixels because animated transforms can produce tiny floating-point differences (for example 230.000122px for a 230px card). No UI change was needed.

Remaining issues: existing lint warnings remain. Lowercase `/images/clients/` URLs must not be reintroduced while the physical folder is named `Images`. Verification used the local production server backed by Atlas; no deployment was performed.
