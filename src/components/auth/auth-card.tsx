import type { ReactNode } from "react";

import { Brand } from "@/components/shared/brand";

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <Brand className="mb-8 justify-center" />
        <section className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
          <h1 className="text-2xl font-black tracking-tight text-slate-950">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          <div className="mt-7">{children}</div>
        </section>
      </div>
    </main>
  );
}
