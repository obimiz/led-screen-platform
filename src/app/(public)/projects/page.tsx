import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
/* eslint-disable @typescript-eslint/no-explicit-any */ import Link from "next/link";
import { getPublishedPortfolioProjects } from "@/services/portfolio";
export const dynamic = "force-dynamic";
export default async function Page() {
  const rows = await getPublishedPortfolioProjects();
  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="text-sm font-bold tracking-widest text-brand-700 uppercase">
        Our projects
      </p>
      <h1 className="mt-3 text-4xl font-black">
        Selected work and case studies
      </h1>
      <p className="mt-4 max-w-2xl text-slate-600">
        Explore completed LED, event and technology projects. Public details are
        shared with customer privacy in mind.
      </p>
      {rows.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed p-8">
          Our project portfolio is being updated.{" "}
          <Link className="font-bold text-brand-700" href="/contact">
            Contact us to discuss your project.
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((x: any) => (
            <Link
              key={x.id}
              href={`/projects/${x.slug}`}
              className="overflow-hidden rounded-2xl border"
            >
              <div className="flex aspect-video items-center justify-center bg-slate-100">
                {x.coverImageUrl ? (
                  <img
                    src={x.coverImageUrl}
                    alt={x.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-slate-400">Project image</span>
                )}
              </div>
              <div className="p-5">
                <h2 className="text-xl font-bold">{x.title}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {x.shortDescription}
                </p>
                <p className="mt-3 text-xs text-brand-700 uppercase">
                  {x.projectType} ·{" "}
                  {[x.city, x.state].filter(Boolean).join(", ")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return staticPageMetadata("/projects", await searchParams);
}
