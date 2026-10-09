import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import { Container } from "@/components/ui/container";
import {
  createEmailUrl,
  createPhoneUrl,
  createWhatsAppUrl,
} from "@/lib/utils/contact";
import type { PublicBusinessSettings } from "@/types/business-settings";

export function Footer({ settings }: { settings: PublicBusinessSettings }) {
  const whatsappUrl = createWhatsAppUrl(
    settings.whatsappNumber,
    "Hello, I would like to enquire about your services.",
  );

  return (
    <footer
      id="contact"
      className="border-t border-white/10 bg-brand-900 py-10 text-slate-300"
    >
      <Container className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <Brand
            businessName={settings.businessName}
            shortName={settings.shortName}
            logoUrl={settings.logoUrl}
          />
          <p className="max-w-lg text-sm leading-6 text-slate-400">
            {settings.description || settings.tagline}
          </p>
        </div>
        <div className="text-sm leading-7">
          <h2 className="mb-2 font-bold text-white">Contact</h2>
          {settings.primaryEmail && (
            <p>
              <a
                href={createEmailUrl(settings.primaryEmail)}
                className="hover:text-brand-300"
              >
                {settings.primaryEmail}
              </a>
            </p>
          )}
          {settings.primaryPhone && (
            <p>
              <a
                href={createPhoneUrl(settings.primaryPhone)}
                className="hover:text-brand-300"
              >
                {settings.primaryPhone}
              </a>
            </p>
          )}
          {whatsappUrl && (
            <p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand-300"
              >
                Chat on WhatsApp
              </a>
            </p>
          )}
          {settings.address && (
            <p className="mt-2 text-slate-400">{settings.address}</p>
          )}
        </div>
        <div className="text-sm">
          <nav aria-label="Footer">
            <h2 className="mb-3 font-bold text-white">Explore</h2>
            <div className="mb-6 flex flex-wrap gap-x-4 gap-y-2">
              {[
                ["Services", "/services"],
                ["LED Rental", "/rent-led-screen"],
                ["Projects", "/projects"],
                ["Testimonials", "/testimonials"],
                ["Contact", "/contact"],
              ].map(([name, href]) => (
                <Link key={href} href={href} className="hover:text-brand-300">
                  {name}
                </Link>
              ))}
            </div>
          </nav>
          <h2 className="mb-3 font-bold text-white">Connect</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {settings.socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand-300"
              >
                {social.label}
              </a>
            ))}
          </div>
          <p className="mt-6 text-slate-500">
            © {new Date().getFullYear()} {settings.businessName}
          </p>
        </div>
      </Container>
    </footer>
  );
}
