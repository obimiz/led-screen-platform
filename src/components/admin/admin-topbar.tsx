"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { siteConfig } from "@/lib/config/site";
import { adminNavigation } from "@/lib/constants/navigation";
import type { SafeAdmin } from "@/types/auth";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function AdminTopbar({ admin }: { admin: SafeAdmin }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative flex h-18 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <NotificationBell />
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? "Close admin navigation" : "Open admin navigation"}
          aria-expanded={open}
          aria-controls="admin-mobile-navigation"
          className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="text-sm font-semibold text-slate-900">Administration</p>
          <p className="hidden text-xs text-slate-500 sm:block">
            {siteConfig.name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-slate-500 md:inline">
          {admin.name}
        </span>
        <Link
          href="/"
          className="hidden text-sm font-semibold text-brand-700 hover:text-brand-600 sm:inline"
        >
          View site
        </Link>
        <LogoutButton />
      </div>
      {open && (
        <nav
          id="admin-mobile-navigation"
          aria-label="Admin mobile navigation"
          className="absolute inset-x-0 top-full z-40 border-y border-slate-200 bg-white p-3 shadow-lg lg:hidden"
        >
          {adminNavigation.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
