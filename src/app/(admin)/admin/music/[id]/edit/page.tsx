import { notFound } from "next/navigation";
import { requireMusicAdmin } from "@/lib/music/access";
import { getMusicCategories, getMusicById } from "@/services/music";
import { MusicContentForm } from "@/components/music/content-form";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMusicAdmin();
  const item = await getMusicById((await params).id);
  if (!item) notFound();
  const categories = await getMusicCategories(true);
  return (
    <main className="p-6">
      <h1 className="mb-6 text-3xl font-black">Edit Music & Audio</h1>
      <MusicContentForm initial={item} categories={categories} />
    </main>
  );
}
