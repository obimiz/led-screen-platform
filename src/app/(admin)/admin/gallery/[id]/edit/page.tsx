import { notFound } from "next/navigation";
import { requireGalleryAdmin } from "@/lib/gallery/access";
import { GalleryItemForm } from "@/components/gallery/item-form";
import { getGalleryItemById, getGalleryFormOptions } from "@/services/gallery";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireGalleryAdmin();
  const item = await getGalleryItemById((await params).id);
  if (!item) notFound();
  const options = await getGalleryFormOptions();
  return (
    <main className="p-6">
      <h1 className="mb-6 text-3xl font-black">Edit Gallery Item</h1>
      <GalleryItemForm initial={item} {...options} />
    </main>
  );
}
