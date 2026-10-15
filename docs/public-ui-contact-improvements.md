# Public UI and contact improvements

## Implementation

- The existing public header uses `position: sticky`, `top: 0` and z-index 50. It stays in normal document flow, so initial headings retain their space. Public anchor targets have a scroll margin for the sticky header. The logo, links, colours and desktop arrangement remain; narrow mobile layouts reserve space between the brand text and cart control.
- Desktop More and mobile navigation now share one open-menu state. Selecting a link closes the menu immediately. Outside pointer/click, Escape, focus leaving navigation, browser history navigation and viewport resizing close it. The navigation state remounts on pathname or query changes. Escape restores focus to the appropriate toggle. Links retain ordinary Tab/Enter keyboard navigation, and buttons expose `aria-expanded` and `aria-controls`. Long dropdowns scroll within the available viewport.
- A CSS rule scoped to `.public-site` gives all existing brand-red `bg-primary` links/buttons white text and inherited white SVG icon colour. Existing dimensions, backgrounds, hover and disabled styles remain. Other background colours and the admin shell are unaffected.
- One official public contact constant supplies `+234 803 930 8982` and `+2348039308982`. The public settings DTO and fallback use these values; stored admin settings, document settings, email, address and other contact data are preserved. The Contact page and footer show phone and WhatsApp icons and readable numbers with `tel:+2348039308982` and `https://wa.me/2348039308982` links.
- The existing reusable floating WhatsApp component was updated, rather than duplicated. The public layout still renders it exactly once. It uses a white chat/telephone icon, WhatsApp green, an accessible label, focus outline, mobile safe-area margins and `noopener noreferrer`. Its destination is exactly `https://wa.me/2348039308982?text=Hello%20Image%20Grant%20Technology%2C%20I%20would%20like%20to%20make%20an%20enquiry.` Reduced-motion preferences disable colour transitions. Extra footer bottom spacing prevents the button from covering the final footer content.

## Files changed for this task

- `src/components/layout/header.tsx`
- `src/components/layout/mobile-navigation.tsx`
- `src/components/layout/footer.tsx`
- `src/components/layout/whatsapp-floating.tsx`
- `src/components/shared/whatsapp-icon.tsx` (new reusable SVG icon)
- `src/lib/constants/contact.ts` (new official public contact constant)
- `src/app/(public)/layout.tsx`
- `src/app/(public)/contact/page.tsx`
- `src/app/globals.css`
- `src/services/business-settings.ts` (public contact DTO/fallback only for this task)
- `tests/public-ui.browser.ts` (new read-only browser checks)
- `tests/security-headers.integration.ts` (public contact/admin setting preservation checks)
- This report.

Pre-existing local product, gallery and security work was preserved. No admin navigation component, database model, collection, product or image record was edited for this task.

## Verification results

- Production build: passed.
- TypeScript: passed.
- ESLint: zero errors, 50 existing warnings, principally raw image tags, unused lint suppressions and existing serializer variables.
- Unit tests: all 52 passed.
- Read-only Chrome suite: all four groups passed across 11 public routes and widths 320, 390, 768, 1024 and 1440 pixels. Covered homepage, catalogue, existing product detail, gallery, services, contact, accessories, bell/alarm, installation, maintenance and rental pages. Checked sticky positioning and heading clearance, computed white text/icon colours, exact contact/WhatsApp links, one floating button, desktop/mobile dropdown dismissal, keyboard focus, query navigation, resizing, mobile overflow, viewport-contained menus, reduced motion, contact submit clearance, absence of the public header/button on admin login, and zero browser runtime errors.
- Isolated production integration: all seven groups passed. Public and authenticated admin pages retain secure production headers. A fixture with old stored phone/WhatsApp values renders the official public links while the authenticated settings API still returns the original stored values. All settings fields and timestamps remain unchanged; unrelated email is preserved.
- Mobile and tablet screenshots were visually reviewed. Screenshots/logs are under `/private/tmp/public-ui-*`.

Reproduction commands:

```sh
npm run lint
npm run typecheck
node --import tsx --test tests/*.test.ts
npm run build
node --import tsx tests/security-headers.integration.ts
# With the local application running:
node --import tsx tests/public-ui.browser.ts
```

The integration test uses ephemeral MongoDB fixtures. The browser suite only reads the running website and does not submit forms. WhatsApp/tel destinations were validated without opening an external chat or initiating a call. No database migration, commit, push or deployment was performed.
