import { JsonLd } from "@/components/seo/json-ld";
import { buildServiceJsonLd } from "@/lib/seo/structured-data";
import { publicPages } from "@/lib/seo/pages";
import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import Link from "next/link";
import { getPublicBusinessSettings } from "@/services/business-settings";
import { createWhatsAppUrl } from "@/lib/utils/contact";
export const dynamic = "force-dynamic";
export default async function LedInstallation() {
  const b = await getPublicBusinessSettings();
  const w = createWhatsAppUrl(
    b.whatsappNumber,
    "Hello, I would like to discuss an LED screen installation for my location.",
  );
  return (
    <main>
      <JsonLd
        data={buildServiceJsonLd(
          publicPages["/led-installation"][0],
          publicPages["/led-installation"][1],
          "/led-installation",
        )}
      />
      <section className="bg-brand-900 px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold tracking-widest text-brand-300 uppercase">
            LED installation
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black sm:text-6xl">
            Permanent LED displays planned for your space.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            From indoor walls and churches to outdoor commercial displays, we
            help assess the site, recommend equipment, install and commission
            the screen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/led-installation/request"
              className="rounded-lg bg-primary px-5 py-3 font-bold text-white"
            >
              Request Installation Assessment
            </Link>
            {w && (
              <a
                href={w}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/30 px-5 py-3 font-bold"
              >
                Ask on WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            "Site assessment",
            "Review structure, power, access and measurements.",
          ],
          ["Screen supply", "Select a suitable LED product and accessories."],
          ["Installation", "Mount, connect and configure the display."],
          [
            "Testing and handover",
            "Test the system and record commissioning details.",
          ],
        ].map(([t, d]) => (
          <article key={t} className="rounded-xl border border-slate-200 p-5">
            <h2 className="font-bold">{t}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{d}</p>
          </article>
        ))}
      </section>
      <nav
        aria-label="Related services"
        className="mx-auto flex max-w-5xl flex-wrap gap-5 px-4 pb-10 text-brand-700"
      >
        <Link className="underline" href="/led-maintenance">
          Maintenance and repairs
        </Link>
        <Link className="underline" href="/projects">
          View project examples
        </Link>
        <Link className="underline" href="/contact">
          Discuss your requirements
        </Link>
      </nav>
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return staticPageMetadata("/led-installation", await searchParams);
}
