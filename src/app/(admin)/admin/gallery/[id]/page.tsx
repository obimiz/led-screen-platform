import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGalleryAdmin } from "@/lib/gallery/access";
import { getGalleryItemById } from "@/services/gallery";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireGalleryAdmin();
  const x = await getGalleryItemById((await params).id);
  if (!x) return notFound();
  return (
    <main className="p-6">
      <p className="text-sm text-slate-500">
        {x.status} · {x.mediaType}
      </p>
      <h1 className="mt-2 text-3xl font-black">{x.title}</h1>
      {x.imageUrl && (
        <img
          src={x.imageUrl}
          alt={x.altText || x.title}
          className="mt-6 max-w-2xl rounded-xl"
        />
      )}
      <div className="mt-6">
        <Link
          className="rounded-lg border px-4 py-2"
          href={`/admin/gallery/${x.id}/edit`}
        >
          Edit
        </Link>
      </div>
    </main>
  );
}
