import { BellAlarmProductImage } from "@/components/bell-alarm/product-image";
import { JsonLd } from "@/components/seo/json-ld";
import { buildServiceJsonLd } from "@/lib/seo/structured-data";
import { publicPages } from "@/lib/seo/pages";
import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import Link from "next/link";
import { getPublicBusinessSettings } from "@/services/business-settings";
import { createWhatsAppUrl } from "@/lib/utils/contact";
export const dynamic = "force-dynamic";
export default async function Page() {
  const b = await getPublicBusinessSettings();
  const w = createWhatsAppUrl(
    b.whatsappNumber,
    "Hello, I would like to enquire about an electronic bell/alarm system.",
  );
  return (
    <main>
      <JsonLd
        data={buildServiceJsonLd(
          publicPages["/electronic-bell-alarm"][0],
          publicPages["/electronic-bell-alarm"][1],
          "/electronic-bell-alarm",
        )}
      />
      <section className="bg-brand-900 px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-brand-300 text-sm font-bold tracking-widest uppercase">
            Electronic bell & alarm
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black sm:text-6xl">
            Clear, scheduled alerts for your organisation.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Plan programmable bell and alarm systems for schools, churches,
            offices, factories, estates and institutions. We can help with
            equipment selection, installation, configuration and support.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/electronic-bell-alarm/request"
              className="bg-primary rounded-lg px-5 py-3 font-bold text-white"
            >
              Request Quote
            </Link>
            <Link
              href="/electronic-bell-alarm/products"
              className="rounded-lg border border-white/30 px-5 py-3 font-bold"
            >
              View Systems
            </Link>
            {w && (
              <a
                href={w}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/30 px-5 py-3 font-bold"
              >
                WhatsApp Us
              </a>
            )}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            "Programmable schedules",
            "Document bell and alert schedules for daily routines.",
          ],
          [
            "Manual and automatic",
            "Choose an operating mode that suits your organisation.",
          ],
          [
            "Installation and setup",
            "Plan zones, points, speakers, power and configuration.",
          ],
          [
            "Support",
            "Keep equipment maintainable with the existing service workflow.",
          ],
        ].map(([t, d]) => (
          <article key={t} className="rounded-xl border p-5">
            <h2 className="font-bold">{t}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{d}</p>
          </article>
        ))}
      </section>
      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-5xl px-4">
          <p className="text-brand-700 text-sm font-bold tracking-widest uppercase">
            System options
          </p>
          <h2 className="mt-2 text-3xl font-black">
            Built for clear, dependable alerts
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "Digital School Bell",
                "Timed schedules and audible alerts",
                "/images/bell-alarm/digital-school-bell.png",
              ],
              [
                "Church Bell Controller",
                "Reliable service for worship spaces",
                "/images/bell-alarm/church-bell-controller.png",
              ],
              [
                "Factory Alarm Panel",
                "High-visibility operational alerts",
                "/images/bell-alarm/factory-alarm-panel.png",
              ],
              [
                "Wireless Alert Kit",
                "Flexible coverage for offices and estates",
                "/images/bell-alarm/wireless-alert-kit.png",
              ],
            ].map(([name, detail, imageUrl]) => (
              <article
                key={name}
                className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <BellAlarmProductImage name={name} url={imageUrl} />
                <div className="p-4">
                  <h3 className="font-bold">{name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <nav
        aria-label="Related services"
        className="text-brand-700 mx-auto flex max-w-5xl flex-wrap gap-5 px-4 pb-10"
      >
        <Link className="underline" href="/electronic-bell-alarm/accessories">
          Bell system accessories
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
  return staticPageMetadata("/electronic-bell-alarm", await searchParams);
}
