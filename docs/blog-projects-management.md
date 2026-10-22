# Blog & Projects management

## Audit and architecture

The existing site had PortfolioProject and PortfolioCategory Mongoose models, portfolio APIs, public `/projects` pages and a minimal draft-only admin form. The old edit page did not load existing records, categories were read-only, image fields required URLs, and there was no blog, rich editor, publishing workflow or homepage integration.

A read-only inventory of the configured MongoDB database found **zero portfolio records and zero portfolio categories**. No genuine records were created, overwritten or deleted during implementation. No fictional projects, clients, testimonials, articles or category records were seeded.

The implementation extends the existing models and collections rather than creating a duplicate CMS:

- `PortfolioProject` / `portfolioprojects`: projects and articles distinguished by `contentType`. Existing records without that field remain projects. Added rich JSON content, author, publication date, tags, image alt text, completion state and permission fields. Existing operational references and legacy project fields are preserved.
- `PortfolioCategory` / `portfoliocategories`: optional scope for projects, articles or both; existing categories remain shared. Categories can be created, renamed, ordered, activated and deactivated. Used category scopes cannot change and invalidate associations.
- Existing `/api/portfolio` APIs remain the mutation surface. No duplicate content or upload API was introduced. Existing portfolio admin links redirect to the new canonical interface.

## Administration

The sidebar now contains **Blog & Projects** and its category-management link.

Routes:

- `/admin/blog`: search, category/type/status filters, cover thumbnails, creation dates, display order, featured state and 12-record server pagination.
- `/admin/blog/new`: create an article; `?type=project` starts a project form.
- `/admin/blog/[id]/edit`: load and update an existing record.
- `/admin/blog/[id]/preview`: authenticated preview of saved content, including drafts; noindex/nofollow.
- `/admin/blog/categories`: manage dynamic category records. Suggested category names are optional admin suggestions, not public hardcoded categories.

Articles support title, author, excerpt, formatted content, cover, additional images, publication date, tags, featured state, display order and SEO overrides. Projects additionally support client/approved display name, optional location, completion date/state, services delivered, equipment used, project type and optional video URL. Existing challenge, solution and outcome fields continue displaying when present.

Actions include draft saves, publish/unpublish, featured toggles, confirmed archiving and confirmed permanent deletion. Deletion removes only the selected content record; stored images, categories and operational/client records remain intact. Save & Preview persists the current form before opening its protected preview. Forms provide pending/success/error feedback and unsaved-change protection.

Publishing requires a category and detailed content, article author or completed-project date/state, image alt text, and explicit permission to publish content/media. Showing client identity additionally requires client approval. Hidden names are removed/redacted from public descriptions, rich text and SEO fields; operational references never enter public DTOs. Legacy media without an affirmative permission flag remains associated internally but is omitted publicly until approved.

Publication dates are optional and edited in UTC; first publication supplies the current time if unset. A browser check in the Africa/Lagos timezone verifies that editing a UTC date preserves the exact stored timestamp. Invalid calendar dates are rejected server-side. Future scheduling is not implemented: use drafts until ready. A public completed-project status is distinct from draft/published/archived publication status.

## Rich text and media

The maintained [Tiptap React editor](https://tiptap.dev/docs/editor/getting-started/install/nextjs) uses `immediatelyRender: false` and loads only in the admin form. Dependencies added: `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-image` and `@tiptap/extension-text-align` (3.32.0).

Supported formatting: paragraphs, headings 2–4, bold, italic, bullet/numbered lists, hyperlinks, uploaded inline images, blockquotes, alignment, undo and redo. JSON is validated and canonicalised server-side with limits on depth, nodes and text length. Only allowed nodes, marks and attributes survive. Unsafe schemes, arbitrary embeds, script nodes and invalid image URLs are rejected. Published content is rendered through explicit React elements with escaped text, **never raw user HTML**. Plain legacy descriptions remain readable. JSON-LD continues using the existing safe serializer.

Cover, multi-image and inline uploads reuse `/api/product-images` and `/api/product-images/[id]`: authenticated uploads, actual PNG/JPEG/WebP signature validation, 4 MiB limits and persistent MongoDB image assets. The form offers previews, existing-image-library selection, cover replacement/removal, per-image alt text and photograph reordering/removal. No files are written into deployment directories. Removing/replacing content associations does not delete shared assets.

Public covers use Next Image, responsive sizes and aspect ratios; photographs can be enlarged in a keyboard-accessible native dialog with previous/next controls and Escape support. Video embeds are restricted to canonical YouTube embeds; other valid HTTP(S) videos use safe external links.

## Public pages and homepage

- `/blog`: published articles, featured cards, title/excerpt/tag search, dynamic category filtering, 12-record pagination and useful empty/loading/error states.
- `/blog/[slug]`: title, cover, author/date, formatted article, additional photos, tags, related articles, social sharing and contact/WhatsApp CTAs.
- `/projects`: approved completed-project portfolio with search, categories, featured cards and pagination.
- `/projects/[slug]`: approved client identity, location/date, descriptions, services, equipment, photos/video, related projects and **Request a Similar Project** CTA.

Project enquiries use the official `https://wa.me/2348039308982` number, with the project title/link included in the enquiry message. Article sharing uses WhatsApp, Facebook, LinkedIn and email sharing links. External links use safe rel attributes.

The homepage adds one **Recent Projects & Insights** section, limited to four published featured records ordered by administrator display order and publication date. It includes View All Projects and Visit Blog links and is hidden until appropriate records exist. Existing hero, services, products, clients, gallery, music and contacts remain intact. Blog joins the existing Projects link in desktop/mobile navigation and the footer; existing sticky/dropdown behavior is retained.

## Security, SEO and caching

- All metadata mutations, private listings and previews require the existing active admin authentication/role system. Mutations also enforce the existing same-origin/reverse-proxy convention.
- Server-side Zod validation whitelists fields. CMS forms cannot change linked operational records or references. Unique slugs are generated with collision handling and bounded retry for concurrent inserts/updates.
- All public content queries, related content, homepage features and sitemap queries enforce publication status, completed-project eligibility and publication date. Draft/archived/unpublished content does not reach public metadata or listings.
- SEO uses existing canonical-origin, metadata, image, robots and breadcrumb conventions. Articles add article Open Graph properties and BlogPosting structured data; projects retain CreativeWork structured data. Published entries join the existing sitemap. Filtered/paginated search states retain the existing noindex policy.
- Mutations invalidate the homepage, blog/projects listings and detail patterns, admin lists and sitemap. Public pages are dynamically rendered, so unpublishing takes effect without source edits.

## Files created

- `src/lib/publishing/rich-content.ts`
- `src/lib/seo/publishing.ts`
- `src/components/publishing/actions.tsx`
- `src/components/publishing/card.tsx`
- `src/components/publishing/catalogue.tsx`
- `src/components/publishing/categories.tsx`
- `src/components/publishing/detail.tsx`
- `src/components/publishing/editor.tsx`
- `src/components/publishing/media-manager.tsx`
- `src/components/publishing/photo-gallery.tsx`
- `src/components/publishing/rich-content.tsx`
- `src/app/(admin)/admin/blog/page.tsx`
- `src/app/(admin)/admin/blog/new/page.tsx`
- `src/app/(admin)/admin/blog/[id]/edit/page.tsx`
- `src/app/(admin)/admin/blog/[id]/preview/page.tsx`
- `src/app/(admin)/admin/blog/categories/page.tsx`
- `src/app/(admin)/admin/blog/loading.tsx`, `error.tsx`
- `src/app/(public)/blog/page.tsx`
- `src/app/(public)/blog/[slug]/page.tsx`
- `src/app/(public)/blog/loading.tsx`, `error.tsx`
- `src/app/(public)/projects/loading.tsx`, `error.tsx`
- `src/app/api/portfolio/categories/[id]/route.ts`
- `scripts/inspect-publishing.ts` (read-only)
- `tests/publishing.test.ts`
- `tests/publishing.integration.ts`
- This report.

## Files modified

- `package.json`, `package-lock.json`
- `src/models/portfolio-project.ts`, `src/models/portfolio-category.ts`
- `src/lib/validations/portfolio.ts`, `src/lib/portfolio/access.ts`
- `src/services/portfolio.ts`, `src/services/seo-sitemap.ts`
- `src/app/api/portfolio/route.ts`, `[id]/route.ts`, `categories/route.ts`
- `src/components/portfolio/project-form.tsx`
- Legacy `src/app/(admin)/admin/portfolio/page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `[id]/edit/page.tsx`, `categories/page.tsx`
- `src/app/(public)/projects/page.tsx`, `[slug]/page.tsx`
- `src/app/(public)/page.tsx`
- `src/lib/constants/navigation.ts`, `src/components/layout/footer.tsx`
- `src/lib/seo/pages.ts`, `src/app/globals.css` (editor-scoped formatting)

## Verification

```sh
npm run lint
npm run typecheck
node --import tsx --test tests/*.test.ts
npm run build
node --import tsx tests/publishing.integration.ts
```

Executed results:

| Check                                | Result                                                      |
| ------------------------------------ | ----------------------------------------------------------- |
| ESLint                               | Passed: 0 errors; 36 remaining warnings in existing modules |
| TypeScript                           | Passed: `tsc --noEmit`                                      |
| Automated unit tests                 | 63 passed, 0 failed                                         |
| Production build                     | Passed: Next.js 16.3.3 / webpack                            |
| Production browser/integration suite | 10 checks passed, including 390px, 768px and 1440px layouts |
| Diff whitespace check                | Passed                                                      |
| Configured database inventory        | Read-only; no portfolio records or categories found         |

Browser checks use real authenticated UI actions for creation, media upload, rich-text editing, preview and publication. Negative cases verify unauthorised access, cross-origin mutations, invalid rich content, missing publication permissions, incompatible categories and unconfirmed deletion. The final full suite completed successfully with no browser runtime errors.

The integration suite uses temporary MongoDB, a local production Next server and Chrome. All records and uploaded media are disposable; the configured business database is never its target. It tests login, categories, articles/projects, uploads, rich text, preview, publication/permissions, private names, search, pagination, homepage, SEO/sitemap, mobile/tablet/desktop navigation/layouts, photo viewer, unpublish/archive/delete and retained media. Product, gallery and organisation fixtures are compared before/after, and existing admin/public module pages are loaded. Temporary MongoDB and browser/server processes are cleaned up.

## Deployment and limitations

- Install dependencies with the updated lockfile, build normally and restart the application. Restart an already-running development server so Mongoose loads the extended schemas.
- Uses existing MongoDB and image-serving infrastructure; no paid services, manual public-directory uploads, destructive migrations or seeds are required. Allow normal Mongoose index creation for the added content-type/status index. Preserve existing database backups and production canonical/indexing environment settings.
- Run on a host supporting the existing authenticated image-upload route and its 4 MiB request limit. Existing public image URLs remain public assets; private post metadata is protected separately.
- Future scheduling, collaborative editing and article revision history are outside this implementation. Physical mobile devices were not tested; browser viewport checks cover desktop, tablet and mobile widths.
- `npm audit --omit=dev` reported existing advisories in axios 1.19.0, fast-uri 3.1.6, Next 16.3.3, sharp 0.35.3 and source-map-js 1.2.1. Their versions match the original lockfile. These require a separate dependency/security upgrade review; no Tiptap package was flagged by that production audit.

No commit, push or deployment was performed.
