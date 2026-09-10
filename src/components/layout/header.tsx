import Link from "next/link";

import { Brand } from "@/components/shared/brand";
import { Container } from "@/components/ui/container";
import { publicNavigation } from "@/lib/constants/navigation";
import type { PublicBusinessSettings } from "@/types/business-settings";
import { MobileNavigation } from "./mobile-navigation";

export function Header({ settings }: { settings: PublicBusinessSettings }) {
  return (
    <header className="relative z-50 border-b border-white/10 bg-slate-950">
      <Container className="flex h-18 items-center justify-between">
        <Brand
          businessName={settings.businessName}
          shortName={settings.shortName}
          logoUrl={settings.logoUrl}
        />
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-7 md:flex"
        >
          {publicNavigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-300 transition hover:text-cyan-300"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/#contact"
            className="rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Request a consultation
          </Link>
        </nav>
        <MobileNavigation />
      </Container>
    </header>
  );
}
