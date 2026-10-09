import { requireGalleryAdmin } from "@/lib/gallery/access";
import { getGalleryCategories } from "@/services/gallery";
import { GalleryCategoryForm } from "@/components/gallery/category-form";
export const dynamic = "force-dynamic";
export default async function Page() { await requireGalleryAdmin(); const categories = await getGalleryCategories(); return <main className="p-6"><h1 className="text-3xl font-black">Gallery categories</h1><GalleryCategoryForm /><div className="mt-8 grid gap-3 sm:grid-cols-2">{categories.map((c: any) => <div key={c.id} className="rounded-lg border p-4"><strong>{c.name}</strong><p className="text-sm text-slate-500">/{c.slug}</p></div>)}</div></main>; }
