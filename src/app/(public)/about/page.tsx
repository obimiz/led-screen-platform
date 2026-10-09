import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import Link from "next/link";
import { getPublicBusinessSettings } from "@/services/business-settings";
export const dynamic = "force-dynamic";
export default async function Page() {
  const b = await getPublicBusinessSettings();
  return (
    <main>
      <section className="bg-brand-900 px-4 py-16 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold tracking-widest text-brand-300 uppercase">
            About {b.businessName}
          </p>
          <h1 className="mt-3 text-4xl font-black">
            Technology solutions planned around your needs.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            {b.description ||
              b.tagline ||
              "We provide LED display solutions, project support and related technology services."}
          </p>
        </div>
      </section>
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
            className="rounded-lg bg-primary px-5 py-3 font-bold text-white"
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
