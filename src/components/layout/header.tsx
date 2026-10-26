"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Brand } from "@/components/shared/brand";
import { Container } from "@/components/ui/container";
import {
  mainPublicNavigation,
  morePublicNavigation,
} from "@/lib/constants/navigation";
import type { PublicBusinessSettings } from "@/types/business-settings";
import { MobileNavigation } from "./mobile-navigation";
import { CartIndicator } from "@/components/cart/cart-controls";

function PublicNavigation() {
  const [open, setOpen] = useState<"mobile" | null>(null);
  const root = useRef<HTMLDivElement>(null),
    desktopToggle = useRef<HTMLElement>(null),
    desktopDetails = useRef<HTMLDetailsElement>(null),
    mobileToggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const closeDesktop = () => {
      if (desktopDetails.current) desktopDetails.current.open = false;
    };
    const outside = (event: Event) => {
      if (
        event.target instanceof Node &&
        !root.current?.contains(event.target)
      ) {
        setOpen(null);
        closeDesktop();
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && desktopDetails.current?.open) {
        closeDesktop();
        desktopToggle.current?.focus();
      }
      if (event.key === "Escape" && open) {
        setOpen(null);
        mobileToggle.current?.focus();
      }
    };
    const close = () => {
      setOpen(null);
      closeDesktop();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("click", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("popstate", close);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("click", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("popstate", close);
      window.removeEventListener("resize", close);
    };
  }, [open]);
  return (
    <div
      ref={root}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
          setOpen(null);
          if (desktopDetails.current) desktopDetails.current.open = false;
        }
      }}
      onBlur={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          setOpen(null);
          if (desktopDetails.current) desktopDetails.current.open = false;
        }
      }}
    >
      <nav
        aria-label="Main navigation"
        className="hidden items-center gap-3 xl:flex 2xl:gap-5"
      >
        {mainPublicNavigation.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="hover:text-brand-300 text-sm font-medium text-slate-300 transition"
          >
            {item.label}
          </Link>
        ))}
        <details ref={desktopDetails} className="relative">
          <summary
            ref={desktopToggle}
            aria-controls="public-more-navigation"
            className="hover:text-brand-300 cursor-pointer list-none text-sm font-medium text-slate-300 transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white [&::-webkit-details-marker]:hidden"
          >
            More <span aria-hidden="true">⌄</span>
          </summary>
          <div
            id="public-more-navigation"
            className="absolute top-8 right-0 z-50 grid max-h-[calc(100dvh-6rem)] min-w-52 gap-1 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl"
          >
            {morePublicNavigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="hover:text-brand-300 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </details>
        <CartIndicator />
        <Link
          href="/request-quote"
          className="bg-primary hover:bg-primary-hover rounded-lg px-4 py-2.5 text-sm font-bold text-white transition"
        >
          Request a Quote
        </Link>
      </nav>
      <MobileNavigation
        open={open === "mobile"}
        onToggle={() => setOpen((v) => (v === "mobile" ? null : "mobile"))}
        onClose={() => setOpen(null)}
        toggleRef={mobileToggle}
      />
    </div>
  );
}
export function Header({ settings }: { settings: PublicBusinessSettings }) {
  const pathname = usePathname();
  const search = useSearchParams();
  return (
    <header
      className="bg-brand-900 sticky top-0 z-50 shrink-0 border-b border-white/10"
      data-public-header
    >
      <Container className="flex h-18 items-center justify-between">
        <Brand
          className="min-w-0 pr-16 xl:pr-0"
          businessName={settings.businessName}
          shortName={settings.shortName}
          logoUrl={settings.logoUrl}
        />
        <PublicNavigation key={`${pathname}?${search.toString()}`} />
      </Container>
    </header>
  );
}
