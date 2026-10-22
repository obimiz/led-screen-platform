import {
  PublishingCatalogue,
  type PublishingQuery,
} from "@/components/publishing/catalogue";
import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<PublishingQuery>;
}) {
  return <PublishingCatalogue kind="project" query={await searchParams} />;
}
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return staticPageMetadata("/projects", await searchParams);
}
