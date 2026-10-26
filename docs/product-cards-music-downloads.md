# Accessory card alignment and downloadable music

## Accessory cards

`/led-accessories` now uses a stretching grid with equal-height rows. Accessory cards use a full-height flex column and a growing content area. Price, stock and the two primary action buttons sit in a bottom-aligned footer. The price block reserves enough space for promotional pricing; stock has consistent line height. View Details and WhatsApp use equal-width columns and consistent minimum button heights. Space for optional Add to Cart functionality remains consistent across cards, so purchase eligibility does not move the other controls. Image fitting, galleries, existing actions, descriptions and pricing behavior are preserved.

## Music upload and download workflow

1. Open Dashboard → Music & Audio → Add music (`/admin/music/new`).
2. Enter the song title and artist/choir/composer; select a category if desired.
3. Set Audio source to Uploaded recording and upload an MP3, M4A or PCM WAV file. The form displays the configured maximum size (50 MB by default). Optionally upload a cover photograph.
4. Select the rights basis and confirm permission to stream, using the existing form controls.
5. Check Allow public downloads to enable distribution of the uploaded recording.
6. Publish music. Enable Featured music if it should appear in the Music page's featured section.

Visitors can listen and use Download audio on music cards or the individual recording page. Existing recordings can be edited to enable the checkbox; no records were automatically changed. Downloads apply to uploaded recordings in the existing MongoDB GridFS audio store. Third-party embeds retain their existing platform playback behavior.

The existing `permissionToDistribute` field controls downloads; no model, collection, storage service or migration was introduced. Public DTOs expose a generated download URL without exposing private rights notes. `/api/music/audio/[id]?download=1` sends the original stored bytes with a safe attachment filename only when a published owned-source record has the existing rights confirmation and distribution permission. Download requests for drafts, unpublished records and revoked permission return 404. Streaming, seeking/ranges, HEAD responses and authenticated admin previews continue through the same endpoint.

## Files

- `src/components/products/accessory-card.tsx`
- `src/app/(public)/led-accessories/page.tsx`
- `src/components/music/audio-player.tsx`
- `src/components/music/music-card.tsx`
- `src/components/music/content-form.tsx`
- `src/app/(public)/music/[slug]/page.tsx`
- `src/app/api/music/audio/[id]/route.ts`
- `src/services/music.ts`
- `tests/catalogue-redesign.integration.ts`
- `tests/music.integration.ts`

## Verification

TypeScript and 19 relevant unit tests passed. ESLint completed with zero errors and 36 previously recorded warnings. Production build passed. All 25 catalogue integration checks passed, including measured equal card heights and matching price, stock, View Details and WhatsApp positions at 390, 768 and 1440-pixel widths, using varied title/description lengths, promotional/quote pricing, single/multiple photos and cart eligibility. All 11 music integration checks passed, including real admin upload/publish, public browser download with exact stored bytes, safe attachment headers, draft/revoked/unpublished download denial, streaming/ranges/HEAD, replacement audio, retained historical media and responsive playback. No client runtime exceptions were observed. The music test's featured-content assertions now target `/music`, matching the current public page structure. `git diff --check` passed.

Integration fixtures use disposable MongoDB data and synthetic photographs/audio. Physical devices were not tested. No production music, product or media records were changed. No commit, push or deployment was performed.
