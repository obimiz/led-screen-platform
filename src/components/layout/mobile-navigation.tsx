"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { publicNavigation } from "@/lib/constants/navigation";
import { CartIndicator } from "@/components/cart/cart-controls";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="grid size-10 place-items-center rounded-lg border border-white/15 text-white"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Close navigation" : "Open navigation"}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div className="absolute right-16 top-4"><CartIndicator /></div>
      {open && (
        <nav
          id="mobile-navigation"
          className="absolute inset-x-0 top-full border-t border-white/10 bg-brand-900 px-4 py-4 shadow-xl"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {publicNavigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-200 hover:bg-white/5 hover:text-brand-300"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/request-quote" onClick={() => setOpen(false)} className="mt-2 rounded-lg bg-primary px-3 py-3 text-center text-sm font-bold text-white">Request a Quote</Link>
          </div>
        </nav>
      )}
    </div>
  );
}
