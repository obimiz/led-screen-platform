import { notFound } from "next/navigation";
import { requirePortfolioAdmin } from "@/lib/portfolio/access";
import { getPortfolioProjectById } from "@/services/portfolio";
import { PublishingDetail } from "@/components/publishing/detail";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Private post preview",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePortfolioAdmin();
  const item = await getPortfolioProjectById((await params).id);
  if (!item) notFound();
  return <PublishingDetail item={item} preview />;
}
