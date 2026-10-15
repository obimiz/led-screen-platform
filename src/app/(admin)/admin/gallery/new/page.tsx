import { requireGalleryAdmin } from "@/lib/gallery/access";
import { GalleryItemForm } from "@/components/gallery/item-form";
import { getGalleryFormOptions } from "@/services/gallery";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireGalleryAdmin();
  const options = await getGalleryFormOptions();
  return (
    <main className="p-6">
      <h1 className="mb-6 text-3xl font-black">Add Gallery Item</h1>
      <GalleryItemForm {...options} />
    </main>
  );
}
