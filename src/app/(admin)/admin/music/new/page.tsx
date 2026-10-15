import { requireMusicAdmin } from "@/lib/music/access";
import { getMusicCategories } from "@/services/music";
import { MusicContentForm } from "@/components/music/content-form";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireMusicAdmin();
  const categories = await getMusicCategories(true);
  return (
    <main className="p-6">
      <h1 className="mb-6 text-3xl font-black">Add Music & Audio</h1>
      <MusicContentForm categories={categories} />
    </main>
  );
}
