import { notFound } from "next/navigation";
import {
  getContentBySlug,
  getRelatedPortfolioProjects,
} from "@/services/portfolio";
import { PublishingDetail } from "@/components/publishing/detail";
import { buildArticleMetadata } from "@/lib/seo/publishing";
import { buildArticleJsonLd } from "@/lib/seo/publishing";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublicBusinessSettings } from "@/services/business-settings";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await getContentBySlug((await params).slug, "article");
  if (!item) notFound();
  return (
    <>
      <JsonLd data={buildArticleJsonLd(item)} />
      <PublishingDetail
        item={item}
        related={await getRelatedPortfolioProjects(item)}
      />
    </>
  );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await getContentBySlug((await params).slug, "article");
  if (!item) notFound();
  return buildArticleMetadata(item, await getPublicBusinessSettings());
}
