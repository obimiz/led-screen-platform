import Link from "next/link";

import { Brand } from "@/components/shared/brand";
import { Container } from "@/components/ui/container";
import { publicNavigation } from "@/lib/constants/navigation";
import type { PublicBusinessSettings } from "@/types/business-settings";
import { MobileNavigation } from "./mobile-navigation";
import { CartIndicator } from "@/components/cart/cart-controls";

export function Header({ settings }: { settings: PublicBusinessSettings }) {
  return (
    <header className="relative z-50 border-b border-white/10 bg-brand-900">
      <Container className="flex h-18 items-center justify-between">
        <Brand
          businessName={settings.businessName}
          shortName={settings.shortName}
          logoUrl={settings.logoUrl}
        />
        <nav aria-label="Main navigation" className="hidden items-center gap-5 lg:flex">
          {publicNavigation.slice(0, 5).map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-300 transition hover:text-brand-300"
            >
              {item.label}
            </Link>
          ))}
          <details className="group relative">
            <summary className="cursor-pointer list-none text-sm font-medium text-slate-300 transition group-open:text-brand-300 hover:text-brand-300">More <span aria-hidden="true">⌄</span></summary>
            <div className="absolute right-0 top-8 z-50 grid min-w-52 gap-1 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
              {publicNavigation.slice(5).map((item) => <Link key={item.label} href={item.href} className="rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10 hover:text-brand-300">{item.label}</Link>)}
            </div>
          </details>
          <CartIndicator />
          <Link
            href="/request-quote"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover"
          >
            Request a Quote
          </Link>
        </nav>
        <MobileNavigation />
      </Container>
    </header>
  );
}
