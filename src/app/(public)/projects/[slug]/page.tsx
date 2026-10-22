import { notFound } from "next/navigation";
import {
  getContentBySlug,
  getRelatedPortfolioProjects,
} from "@/services/portfolio";
import { PublishingDetail } from "@/components/publishing/detail";
import { buildPortfolioMetadata } from "@/lib/seo/metadata";
import { buildPortfolioJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublicBusinessSettings } from "@/services/business-settings";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await getContentBySlug((await params).slug, "project");
  if (!item) notFound();
  return (
    <>
      <JsonLd data={buildPortfolioJsonLd(item)} />
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
  const item = await getContentBySlug((await params).slug, "project");
  if (!item) notFound();
  return buildPortfolioMetadata(item, await getPublicBusinessSettings());
}
