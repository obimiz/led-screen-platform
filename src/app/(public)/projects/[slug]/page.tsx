import { buildPortfolioJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPortfolioMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
/* eslint-disable @typescript-eslint/no-explicit-any */ import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPortfolioProjectBySlug,
  getRelatedPortfolioProjects,
} from "@/services/portfolio";
import { getPublicBusinessSettings } from "@/services/business-settings";
import { createWhatsAppUrl } from "@/lib/utils/contact";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [p, b] = await Promise.all([
    getPortfolioProjectBySlug((await params).slug),
    getPublicBusinessSettings(),
  ]);
  if (!p) return notFound();
  const related = await getRelatedPortfolioProjects(p);
  const w = createWhatsAppUrl(
    b.whatsappNumber,
    `I'm interested in an LED solution similar to ${p.title}.`,
  );
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { name: "Projects", path: "/projects" },
          { name: p.title, path: `/projects/${p.slug}` },
        ]}
      />
      <JsonLd data={buildPortfolioJsonLd(p)} />
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
        {p.coverImageUrl ? (
          <img
            src={p.coverImageUrl}
            alt={p.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-slate-400">Project image</span>
        )}
      </div>
      <p className="mt-8 text-sm font-bold text-brand-700 uppercase">
        {p.projectType}
      </p>
      <h1 className="mt-2 text-4xl font-black">{p.title}</h1>
      <p className="mt-3 text-slate-600">
        {[p.venueName, p.city, p.state, p.country].filter(Boolean).join(", ")}{" "}
        {p.completionDate && `· Completed ${p.completionDate}`}
      </p>
      <p className="mt-6 max-w-3xl text-lg leading-8">
        {p.description || p.shortDescription}
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {[
          ["Challenge", p.challenge],
          ["Solution", p.solution],
          ["Outcome", p.outcome],
        ]
          .filter(([, v]) => v)
          .map(([t, v]) => (
            <section key={t} className="rounded-xl border p-5">
              <h2 className="font-bold">{t}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{v}</p>
            </section>
          ))}
      </div>
      {p.imageUrls?.length > 0 && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {p.imageUrls.map((u: string, i: number) => (
            <img
              key={u}
              src={u}
              alt={`${p.title} project image ${i + 1}`}
              loading="lazy"
              width={1200}
              height={800}
              className="rounded-xl"
            />
          ))}
        </div>
      )}
      <div className="mt-10 rounded-2xl bg-brand-50 p-7">
        <h2 className="text-2xl font-black">Need a similar solution?</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/request-quote"
            className="rounded-lg bg-primary px-5 py-3 font-bold text-white"
          >
            Request Quote
          </Link>
          {w && (
            <a
              href={w}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border px-5 py-3 font-bold"
            >
              WhatsApp Us
            </a>
          )}
        </div>
      </div>
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-black">Related projects</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {related.map((x: any) => (
              <Link
                key={x.id}
                href={`/projects/${x.slug}`}
                className="rounded-xl border p-4 font-bold"
              >
                {x.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await getPortfolioProjectBySlug((await params).slug);
  if (!item) notFound();
  return buildPortfolioMetadata(item, await getPublicBusinessSettings());
}
