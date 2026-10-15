import Link from "next/link";
import { requireMusicAdmin } from "@/lib/music/access";
import { getMusicCategories } from "@/services/music";
import { MusicCategoryManager } from "@/components/music/category-manager";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireMusicAdmin();
  const categories = await getMusicCategories(true);
  return (
    <main className="p-6">
      <Link className="underline" href="/admin/music">
        Back to Music & Audio
      </Link>
      <h1 className="mt-5 text-3xl font-black">Music categories</h1>
      <MusicCategoryManager categories={categories} />
    </main>
  );
}
