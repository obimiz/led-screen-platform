import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import {
  PublicMusicCatalogue,
  type MusicQuery,
} from "@/components/music/catalogue";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<MusicQuery>;
}) {
  return <PublicMusicCatalogue query={await searchParams} browse />;
}
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return staticPageMetadata("/music/browse", await searchParams);
}
