import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import Link from "next/link";
export default function Page() {
  const items = [
    ["LED Screen Sales", "/led-screens"],
    ["LED Screen Rental", "/rent-led-screen"],
    ["LED Installation", "/led-installation"],
    ["LED Maintenance & Repairs", "/led-maintenance"],
    ["LED Accessories", "/led-accessories"],
    ["Electronic Bell & Alarm", "/electronic-bell-alarm"],
  ];
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-sm font-bold tracking-widest text-brand-700 uppercase">
        Services
      </p>
      <h1 className="mt-3 text-4xl font-black">
        LED solutions and technical support
      </h1>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([t, h]) => (
          <Link
            key={t}
            href={h}
            className="rounded-2xl border p-6 transition hover:border-brand-400"
          >
            <h2 className="text-xl font-bold">{t}</h2>
            <p className="mt-3 text-sm text-slate-600">
              Explore this service and start an enquiry.
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return staticPageMetadata("/services", await searchParams);
}
