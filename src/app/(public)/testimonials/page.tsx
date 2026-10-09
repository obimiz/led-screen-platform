import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
/* eslint-disable @typescript-eslint/no-explicit-any */ import { getPublishedTestimonials } from "@/services/gallery";
export const dynamic = "force-dynamic";
export default async function Page() {
  const rows = await getPublishedTestimonials();
  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-black">What our customers say</h1>
      {rows.length === 0 ? (
        <p className="mt-8">No testimonials have been published yet.</p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {rows.map((x: any) => (
            <blockquote key={x.id} className="rounded-xl border p-6">
              <p className="text-lg leading-7">“{x.quote}”</p>
              <footer className="mt-4 text-sm text-slate-600">
                {x.customerDisplayName}
                {x.organizationName && ` · ${x.organizationName}`}
                {x.roleTitle && ` · ${x.roleTitle}`}
              </footer>
            </blockquote>
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
  return staticPageMetadata("/testimonials", await searchParams);
}
