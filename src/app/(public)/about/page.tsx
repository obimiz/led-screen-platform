import { PageHero } from "@/components/layout/page-hero";
import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import Link from "next/link";
import { getPublicBusinessSettings } from "@/services/business-settings";
export const dynamic = "force-dynamic";
export default async function Page() {
  const b = await getPublicBusinessSettings();
  return (
    <main>
      <PageHero
        title={<>Technology solutions planned around your needs.</>}
        description={
          <>
            {b.description ||
              b.tagline ||
              "We provide LED display solutions, project support and related technology services."}
          </>
        }
      />
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-black">What we do</h2>
        <p className="mt-4 max-w-3xl leading-8 text-slate-600">
          We help customers explore LED screens, request quotations, plan
          rentals and installations, and keep displays supported through
          maintenance services. We also provide electronic bell and alarm
          solutions where they fit the organisation’s needs.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/led-screens"
            className="bg-primary rounded-lg px-5 py-3 font-bold text-white"
          >
            Explore LED Screens
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border px-5 py-3 font-bold"
          >
            Contact us
          </Link>
        </div>
      </section>
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return staticPageMetadata("/about", await searchParams);
}
