import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import Link from "next/link";
import { getBellAlarmProducts } from "@/services/bell-alarm";
export const dynamic = "force-dynamic";
export default async function Page() {
  const products = await getBellAlarmProducts("bell-alarm-accessory");
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-black">Bell and alarm accessories</h1>
      {products.length === 0 ? (
        <p className="mt-10">No electronic bell/alarm accessories yet.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p: any) => (
            <Link
              key={p.id}
              href={`/electronic-bell-alarm/accessories/${p.slug}`}
              className="rounded-xl border p-5"
            >
              <h2 className="text-xl font-bold">{p.name}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {p.shortDescription}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return staticPageMetadata(
    "/electronic-bell-alarm/accessories",
    await searchParams,
  );
}
