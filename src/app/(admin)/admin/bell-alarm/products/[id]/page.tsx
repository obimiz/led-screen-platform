import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBellAlarmAdmin } from "@/lib/bell-alarm/access";
import { getBellAlarmProductById } from "@/services/bell-alarm";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireBellAlarmAdmin();
  const p = await getBellAlarmProductById((await params).id, true);
  if (!p) return notFound();
  return (
    <main className="p-6">
      <p className="text-sm text-slate-500">{p.productType}</p>
      <h1 className="mt-2 text-3xl font-black">{p.name}</h1>
      <p className="mt-4 max-w-2xl whitespace-pre-wrap">{p.description}</p>
      <Link
        className="mt-6 inline-block rounded-lg border px-4 py-2"
        href={`/admin/bell-alarm/products/${p.id}/edit`}
      >
        Edit product
      </Link>
    </main>
  );
}
