import { PageHero } from "@/components/layout/page-hero";
import { Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import { getPublicBusinessSettings } from "@/services/business-settings";
import {
  createEmailUrl,
  createPhoneUrl,
  createWhatsAppUrl,
} from "@/lib/utils/contact";
import { ContactForm } from "@/components/contact/contact-form";
export const dynamic = "force-dynamic";
export default async function Page() {
  const b = await getPublicBusinessSettings();
  const wa = createWhatsAppUrl(b.whatsappNumber);
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-brand-700 text-sm font-bold tracking-widest uppercase">
        Contact
      </p>
      <PageHero
        title={<>Let’s discuss your requirement.</>}
        description={
          <>
            {" "}
            Reach us about LED sales, rentals, installation, maintenance,
            accessories, bell and alarm systems, or general enquiries.{" "}
          </>
        }
      />
      <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl border p-6">
          <h2 className="text-xl font-bold">Contact details</h2>
          <div className="mt-4 space-y-3">
            {b.primaryPhone && (
              <a
                className="text-brand-700 flex items-center gap-2"
                href={createPhoneUrl(b.primaryPhone)}
              >
                <Phone size={20} aria-hidden="true" />
                <span>Call us: {b.primaryPhone}</span>
              </a>
            )}
            {b.primaryEmail && (
              <a
                className="text-brand-700 block"
                href={createEmailUrl(b.primaryEmail)}
              >
                Email us: {b.primaryEmail}
              </a>
            )}
            {wa && (
              <a
                className="text-brand-700 flex items-center gap-2"
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                <span>WhatsApp: {b.primaryPhone}</span>
              </a>
            )}
            {b.address && <p className="text-slate-600">{b.address}</p>}
            {b.businessHours && (
              <p className="text-slate-600">Hours: {b.businessHours}</p>
            )}
          </div>
        </section>
        <section className="rounded-2xl border p-6">
          <h2 className="text-xl font-bold">Send an enquiry</h2>
          <p className="mt-2 text-sm text-slate-500">
            Provide an email, phone, or WhatsApp number so we can follow up.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </section>
      </div>
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return staticPageMetadata("/contact", await searchParams);
}
