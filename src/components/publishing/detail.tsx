import { PageHero } from "@/components/layout/page-hero";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RichContent } from "./rich-content";
import { ProjectPhotos } from "./photo-gallery";
import { ContentCard, type PublishingEntry } from "./card";
import { buildCanonicalUrl } from "@/lib/seo/urls";
import { normalizeMusicSourceUrl } from "@/lib/music/embeds";
export function PublishingDetail({
  item,
  related = [],
  preview = false,
}: {
  item: PublishingEntry;
  related?: PublishingEntry[];
  preview?: boolean;
}) {
  const article = item.contentType === "article",
    base = article ? "/blog" : "/projects",
    url = buildCanonicalUrl(`${base}/${item.slug}`),
    date = item.publishedAt || item.createdAt,
    category = typeof item.categoryId === "object" ? item.categoryId?.name : "";
  const video = normalizeMusicSourceUrl(item.videoUrl || "");
  const enquiry = `https://wa.me/2348039308982?text=${encodeURIComponent(`Hello Image Grant Technology, I would like to enquire about a project similar to ${item.title}. ${url}`)}`;
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {preview && (
        <aside className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <strong>Administrator preview · {item.status}</strong>
          <p className="mt-1">
            This view includes unpublished information. Public visibility still
            depends on publication status and permissions.
          </p>
          <Link
            className="mt-2 inline-block underline"
            href={`/admin/blog/${item.id}/edit`}
          >
            Continue editing
          </Link>
        </aside>
      )}
      <Breadcrumbs
        items={[
          { name: article ? "Blog" : "Projects", path: base },
          { name: item.title, path: `${base}/${item.slug}` },
        ]}
      />
      <p className="text-brand-700 mt-6 text-sm font-bold tracking-wide uppercase">
        {category || (article ? "Article" : "Completed project")}
      </p>
      {preview ? (
        <h1 className="mt-3 text-4xl font-black">{item.title}</h1>
      ) : (
        <PageHero title={item.title} description={item.shortDescription} />
      )}
      {article ? (
        <p className="mt-4 text-sm text-slate-600">
          {item.author && `By ${item.author}`}
          {date && (
            <>
              {" "}
              ·{" "}
              <time dateTime={date}>
                {new Date(date).toLocaleDateString("en-GB", {
                  timeZone: "UTC",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </>
          )}
        </p>
      ) : (
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          {[
            [
              "Client / organisation",
              preview ? item.customerName : item.clientName,
            ],
            [
              "Location",
              [item.venueName, item.city, item.state, item.country]
                .filter(Boolean)
                .join(", "),
            ],
            ["Completed", item.completionDate],
          ]
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div key={label}>
                <dt className="font-semibold">{label}</dt>
                <dd className="mt-1 text-slate-600">{value}</dd>
              </div>
            ))}
        </dl>
      )}
      {item.coverImageUrl && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-slate-50">
          <Image
            src={item.coverImageUrl}
            alt={item.coverAlt || item.title}
            fill
            sizes="(max-width:768px) 100vw,1000px"
            unoptimized={!item.coverImageUrl.startsWith("/")}
            className="object-cover"
          />
        </div>
      )}
      <p className="mt-7 text-lg leading-8 text-slate-600">
        {item.shortDescription}
      </p>
      <RichContent content={item.richContent} fallback={item.description} />
      {!article && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {[
            ["Services delivered", item.servicesProvided],
            ["Equipment used", item.productsUsed],
          ].map(([label, items]) =>
            Array.isArray(items) && items.filter(Boolean).length > 0 ? (
              <section key={String(label)} className="rounded-xl border p-5">
                <h2 className="text-xl font-bold">{String(label)}</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  {items.filter(Boolean).map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </section>
            ) : null,
          )}
        </div>
      )}
      {!article &&
        [item.challenge, item.solution, item.outcome].some(Boolean) && (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Challenge", item.challenge],
              ["Solution", item.solution],
              ["Outcome", item.outcome],
            ]
              .filter(([, v]) => v)
              .map(([name, value]) => (
                <section className="rounded-xl border p-5" key={name}>
                  <h2 className="font-bold">{name}</h2>
                  <p className="mt-3 leading-7">{value}</p>
                </section>
              ))}
          </div>
        )}
      <ProjectPhotos
        article={article}
        images={item.imageUrls || []}
        alts={item.imageAlts || []}
        title={item.title}
      />
      {item.videoUrl && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold">
            {article ? "Video" : "Project video"}
          </h2>
          {video?.includes("youtube-nocookie.com") ? (
            <iframe
              className="mt-4 aspect-video w-full rounded-xl border-0"
              src={video}
              title={`${item.title} video`}
              loading="lazy"
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <a
              className="text-brand-700 mt-4 inline-block font-bold underline"
              href={item.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch project video
            </a>
          )}
        </section>
      )}
      {article && (
        <section className="mt-8">
          <h2 className="font-bold">Share this article</h2>
          <div className="mt-3 flex flex-wrap gap-4">
            {[
              [
                "WhatsApp",
                `https://wa.me/?text=${encodeURIComponent(`${item.title} ${url}`)}`,
              ],
              [
                "Facebook",
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
              ],
              [
                "LinkedIn",
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
              ],
              [
                "Email",
                `mailto:?subject=${encodeURIComponent(item.title)}&body=${encodeURIComponent(url)}`,
              ],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-700 underline"
              >
                {label}
              </a>
            ))}
          </div>
          {item.tags?.length ? (
            <p className="mt-5 text-sm text-slate-600">
              Tags: {item.tags.join(", ")}
            </p>
          ) : null}
        </section>
      )}
      <section className="bg-brand-50 mt-10 rounded-2xl p-7">
        <h2 className="text-2xl font-black">
          {article
            ? "Let’s discuss your requirements"
            : "Request a Similar Project"}
        </h2>
        <p className="mt-3 text-slate-600">
          Talk to Image Grant Technology about equipment, installation and
          service options.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={article ? "/contact" : "/request-quote"}
            className="bg-primary rounded-lg px-5 py-3 font-bold text-white"
          >
            {article ? "Contact us" : "Request a quote"}
          </Link>
          <a
            href={enquiry}
            target="_blank"
            rel="noopener noreferrer"
            className="border-brand-700 text-brand-700 rounded-lg border px-5 py-3 font-bold"
          >
            {article ? "WhatsApp enquiry" : "Enquire about a similar project"}
          </a>
        </div>
      </section>
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold">
            Related {article ? "articles" : "projects"}
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {related.map((v) => (
              <ContentCard key={v.id} item={v} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
