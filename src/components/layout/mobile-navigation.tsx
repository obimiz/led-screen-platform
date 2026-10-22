"use client";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import type { RefObject } from "react";
import {
  mainPublicNavigation,
  morePublicNavigation,
} from "@/lib/constants/navigation";
import { CartIndicator } from "@/components/cart/cart-controls";

export function MobileNavigation({
  open,
  onToggle,
  onClose,
  toggleRef,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  toggleRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <div className="xl:hidden">
      <button
        ref={toggleRef}
        type="button"
        onClick={onToggle}
        className="grid size-10 place-items-center rounded-lg border border-white/15 text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Close navigation" : "Open navigation"}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div className="absolute top-4 right-16">
        <CartIndicator />
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="bg-brand-900 absolute inset-x-0 top-full max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-t border-white/10 px-4 py-4 shadow-xl"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {mainPublicNavigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className="hover:text-brand-300 rounded-lg px-3 py-3 text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
            <details className="rounded-lg">
              <summary className="cursor-pointer px-3 py-3 text-sm font-medium text-slate-200">
                More
              </summary>
              <div className="grid gap-1 border-l border-white/15 pl-3">
                {morePublicNavigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="hover:text-brand-300 rounded-lg px-3 py-3 text-sm font-medium text-slate-200 hover:bg-white/5"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
            <Link
              href="/request-quote"
              onClick={onClose}
              className="bg-primary mt-2 rounded-lg px-3 py-3 text-center text-sm font-bold text-white"
            >
              Request a Quote
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
