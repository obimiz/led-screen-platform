import Link from "next/link";

import { Brand } from "@/components/shared/brand";
import { adminNavigation } from "@/lib/constants/navigation";

export function AdminSidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-brand-900 p-5 lg:flex lg:flex-col">
      <Brand className="mb-10" />
      <nav aria-label="Admin navigation" className="space-y-1">
        {adminNavigation.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-brand-300"
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
      <p className="mt-auto rounded-lg border border-brand-300/20 bg-brand-300/5 p-3 text-xs leading-5 text-brand-100">
        Signed in to the protected administration area.
      </p>
    </aside>
  );
}
