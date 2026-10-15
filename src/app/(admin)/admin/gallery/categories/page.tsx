import { GalleryCategoryEditor } from "@/components/gallery/category-editor";
import { requireGalleryAdmin } from "@/lib/gallery/access";
import { getGalleryCategories } from "@/services/gallery";
import { GalleryCategoryForm } from "@/components/gallery/category-form";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireGalleryAdmin();
  const categories = await getGalleryCategories(true);
  return (
    <main className="p-6">
      <h1 className="text-3xl font-black">Gallery categories</h1>
      <GalleryCategoryForm />
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {categories.map((c: any) => (
          <GalleryCategoryEditor
            key={c.id}
            id={c.id}
            name={c.name}
            isActive={c.isActive}
          />
        ))}
      </div>
    </main>
  );
}
