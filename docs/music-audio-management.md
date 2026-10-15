# Music & Audio management

## Existing implementation and scope

The project already had MusicContent, MusicCategory and MusicArtist models, music APIs, URL-based admin forms, public music pages and a homepage featured section. The edit form did not load existing content, categories were read-only, public listing APIs exposed draft records, and uploaded audio, persistent storage and native playback were missing. A read-only audit found no existing music records or categories. Browser verification also exposed a pre-existing text-index bug: MongoDB interpreted the blank business `language` field as its language override and rejected new tracks. The index now uses a separate, absent-by-default override field. No business records were changed or seeded.

This implementation extends those models, services and routes. It retains existing external music sources, artist pages and legacy admin URLs. Product and gallery storage, authentication and business records are preserved.

## Administrator workflow

- Open **Music & Audio** in the sidebar at `/admin/music`.
- Use `/admin/music/categories` to create, rename, order, activate or deactivate categories. Suggested names are optional admin suggestions, never seeded public records. Deactivation preserves existing associations.
- Add a recording at `/admin/music/new`; edit at `/admin/music/[id]/edit`. Existing `/admin/music/content/...` links still work.
- Upload MP3, audio-only M4A or PCM/float WAV, or select a previously uploaded asset. Preview with native audio controls. Upload a PNG/JPEG/WebP cover through the existing product image service, or supply an existing cover URL.
- Enter title, artist/choir/composer, category, description, optional release year and display order. Save a draft without publishing.
- Before publishing owned audio, confirm streaming rights and choose client ownership or licensing. Ownership, licence and internal notes remain private. Distribution permission is recorded but does not enable downloads.
- Publish/unpublish, feature and archive from the paginated list. Archiving requires confirmation. Asset removal/replacement changes references only; it never deletes shared audio or covers.

Forms include validation, pending feedback, previews and unsaved-change protection. Lists provide title/artist search, category/status filters and 24-record server pagination. Archive is the supported removal action; no permanent deletion UI is provided.

## Public experience

`/music` and `/music/browse` use published MongoDB records, dynamic categories, title/artist search, pagination, featured recordings, meaningful empty states and loading/error boundaries. `/music/[slug]` supports uploaded recordings and validated existing external embeds. The existing homepage featured music section uses the same cards. Saving content invalidates the homepage, music listings and detail/category/artist paths.

Native HTML5 controls provide play/pause, seek, duration and volume where the device supports it. Starting another player pauses the previous one; navigation unmounts and pauses playback. Cover images use Next Image and a branded fallback. No public download action is provided. Streaming cannot prevent a listener from saving bytes already delivered to their browser.

## Storage, security and deployment

- Uses the existing MongoDB connection with a GridFS `musicAudio` bucket (`musicAudio.files` and `musicAudio.chunks`). Music metadata and references remain in the existing MusicContent collection; categories remain in MusicCategory.
- `POST /api/music/audio` accepts a raw audio body, authenticated owner/admin credentials and a same-origin request. It streams to GridFS with backpressure, bounded signature/container validation and a byte counter; complete large recordings are not buffered in memory. Invalid/incomplete uploads are cleaned up.
- MP3 MPEG headers, WAV RIFF/format/data structure and M4A audio-only MP4 containers are checked independently of filename. MP4 video tracks are rejected. This is structural validation, not full codec decoding or antivirus scanning.
- Default limit: 50 MiB per recording. Set server environment `MUSIC_AUDIO_MAX_BYTES` to an integer between 1 KiB and 250 MiB. Invalid values fall back to 50 MiB. MP3 probing is bounded to 256 KiB, so unusually large embedded artwork must be removed; M4A metadata is limited to 2 MiB. Standard browser codecs remain device-dependent.
- `GET /api/music/audio` lists the latest 100 completed uploads for admins. `GET`/`HEAD /api/music/audio/[id]` stream from GridFS with single-byte ranges, suffix/open-ended ranges, 206/416 responses, safe MIME headers and no-store caching.
- Anonymous audio requests require a published owned track referencing the asset with confirmed rights. Draft, archived and unattached assets return 404 to visitors. Unpublishing revokes future requests; already-buffered browser audio cannot be recalled. Shared assets remain accessible while another eligible published track references them.
- Public metadata queries enforce publication status and omit internal ownership/licence/administrator fields. Music mutations reuse the existing admin/session/API conventions and enforce same-origin requests.
- Use a Node-capable deployment with persistent MongoDB and GridFS permissions, backups and adequate database capacity. Configure host/reverse-proxy request-size and timeout limits for the selected upload maximum; the upload route allows up to 300 seconds where the host supports it. No uploads go into deployment directories. No paid storage service, database reset or category/audio seed is required. Existing installations with the legacy text index need the one-time repair below before starting the updated application.

## One-time existing-index repair

```sh
node --import tsx scripts/repair-music-index.ts          # inspect only
node --import tsx scripts/repair-music-index.ts --apply  # rebuild the matching legacy text index
```

The repair was applied successfully to the configured database after the isolated preservation test: zero music documents before and after; no documents modified. Other environments with the old index should run the same command.

The script accepts only the expected legacy music text index, retains its name, weights and default language, and changes only its language override setting. It never updates documents or other indexes. Existing search uses escaped regex queries and remains available during the rebuild. The integration suite verifies the repair against a legacy index and confirms that an existing fixture document remains unchanged. Restart an already-running development server after model changes so Mongoose loads the updated schema.

## Files

New:

- `src/lib/music/audio.ts`, `src/lib/music/storage.ts`
- `src/app/api/music/audio/route.ts`, `src/app/api/music/audio/[id]/route.ts`, `src/app/api/music/categories/[id]/route.ts`
- `src/components/music/audio-player.tsx`, `catalogue.tsx`, `category-manager.tsx`, `item-actions.tsx`
- `src/app/(admin)/admin/music/new/page.tsx`, `[id]/edit/page.tsx`, `loading.tsx`, `error.tsx`
- `src/app/(public)/music/loading.tsx`, `error.tsx`
- `scripts/inspect-music.ts`, `scripts/repair-music-index.ts`, `tests/music-audio.test.ts`, `tests/music.integration.ts`
- This report.

Updated:

- `src/models/music-content.ts`, `src/lib/validations/music.ts`, `src/services/music.ts`, `src/lib/music/access.ts`, `src/lib/music/embeds.ts`
- `src/app/api/music/route.ts`, `[id]/route.ts`, `categories/route.ts`; `artists/route.ts` formatting only
- `src/components/music/content-form.tsx`, `music-card.tsx`, `src/lib/constants/navigation.ts`
- `src/app/(admin)/admin/music/page.tsx`, `categories/page.tsx`, legacy `content/page.tsx`, `content/new/page.tsx`, `content/[id]/page.tsx`, `content/[id]/edit/page.tsx`
- `src/app/(public)/music/page.tsx`, `browse/page.tsx`, `[slug]/page.tsx`, `category/[slug]/page.tsx`
- `tests/music.test.ts`

Earlier unrelated working-tree changes are retained separately.

## Verification

Commands:

```sh
npm run lint
npm run typecheck
node --import tsx --test tests/*.test.ts
npm run build
node --import tsx tests/music.integration.ts
```

Results:

- ESLint: passed with 0 errors and 46 existing warnings (unused directives/variables and existing image usage outside this module).
- TypeScript: passed (`npm run typecheck`).
- Unit tests: 58 passed, 0 failed, including audio-container/range/rights and text-index regression tests.
- Production build: passed (`next build --webpack`).
- Production integration/browser suite: 10 checks passed, including the complete upload-to-archive workflow, real WAV playback on desktop/mobile viewports, negative security checks and unchanged product fixture.
- Read-only inventory and the one-time configured-database index repair completed successfully. No music or category records were seeded into the business database.

MP3/M4A container validation is covered by generated structural unit fixtures; the real browser playback fixture is a generated WAV tone. Physical mobile devices and additional codec encodings were not tested.

The integration suite starts ephemeral MongoDB, a local production server and Chrome. It uses generated test tones and disposable fixtures, never the business database. It checks authenticated upload/preview, persisted chunks, draft privacy, file validation/size/origin restrictions, category management, rights validation, publication, byte-range playback, single-player behavior, search, mobile/desktop layouts, homepage updates, replacement, unpublishing, confirmation and archive retention, pagination and preservation of a product fixture. Temporary MongoDB is stopped and removed afterwards. Physical iOS/Android device testing remains a deployment follow-up.
