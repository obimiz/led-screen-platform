import { JsonLd } from "@/components/seo/json-ld";
import { buildServiceJsonLd } from "@/lib/seo/structured-data";
import { publicPages } from "@/lib/seo/pages";
import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import Link from "next/link";
import { getPublicBusinessSettings } from "@/services/business-settings";
import { getRentableProducts } from "@/services/rentals";
import { createWhatsAppUrl } from "@/lib/utils/contact";
export const dynamic = "force-dynamic";
export default async function RentLedScreenPage() {
  const [business, products] = await Promise.all([
    getPublicBusinessSettings(),
    getRentableProducts(),
  ]);
  const whatsapp = createWhatsAppUrl(
    business.whatsappNumber,
    "Hello, I would like to enquire about renting an LED screen for an event.",
  );
  return (
    <main>
      <JsonLd
        data={buildServiceJsonLd(
          publicPages["/rent-led-screen"][0],
          publicPages["/rent-led-screen"][1],
          "/rent-led-screen",
        )}
      />
      <section className="bg-brand-900 px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold tracking-widest text-brand-300 uppercase">
            LED screen rental
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black sm:text-6xl">
            Make your event easy to see.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            We help event teams plan temporary LED screen rentals for
            conferences, churches, weddings, concerts and other events. Tell us
            your dates and requirements, and we will confirm suitable equipment
            and support.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/rent-led-screen/request"
              className="rounded-lg bg-primary px-5 py-3 font-bold text-white"
            >
              Request Rental Quote
            </Link>
            {whatsapp && (
              <a
                href={whatsapp}
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
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Plan around your event",
              "Share event dates, venue and approximate screen size.",
            ],
            [
              "Indoor or outdoor",
              "We can help assess the right display for the environment.",
            ],
            [
              "Setup support",
              "Request setup, dismantling, transport or an operator.",
            ],
            [
              "Accessories",
              "Include processors, structures and other event equipment.",
            ],
          ].map(([title, body]) => (
            <article
              key={title}
              className="rounded-xl border border-slate-200 p-5"
            >
              <h2 className="font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
        {products.length > 0 && (
          <>
            <h2 className="mt-16 text-2xl font-black">Rentable LED screens</h2>
            <p className="mt-2 text-slate-600">
              Displayed equipment is subject to confirmation for your dates.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <p className="text-xs font-bold text-brand-700 uppercase">
                    {product.indoorOutdoor}
                  </p>
                  <h3 className="mt-2 text-lg font-bold">{product.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {product.description}
                  </p>
                  <Link
                    href={`/rent-led-screen/request?product=${product.slug}`}
                    className="mt-5 inline-block font-semibold text-brand-800 underline"
                  >
                    Request this screen
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
      <nav
        aria-label="Related services"
        className="mx-auto flex max-w-5xl flex-wrap gap-5 px-4 pb-10 text-brand-700"
      >
        <Link className="underline" href="/led-screens">
          Explore LED screens
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
  return staticPageMetadata("/rent-led-screen", await searchParams);
}
