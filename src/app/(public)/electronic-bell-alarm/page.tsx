import { JsonLd } from "@/components/seo/json-ld";
import { buildServiceJsonLd } from "@/lib/seo/structured-data";
import { BellPageView } from "@/components/content/bell-page-view";
import { getBellPage } from "@/services/bell-page";
import { getBellAlarmProducts } from "@/services/bell-alarm";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPublicBusinessSettings } from "@/services/business-settings";
export const dynamic = "force-dynamic";
export default async function Page() {
  const [content, products] = await Promise.all([
    getBellPage(),
    getBellAlarmProducts(),
  ]);
  return (
    <>
      <JsonLd
        data={buildServiceJsonLd(
          content.heading,
          content.introduction,
          "/electronic-bell-alarm",
        )}
      />
      <BellPageView content={content} products={products} />
    </>
  );
}
export async function generateMetadata() {
  const c = await getBellPage();
  return buildPageMetadata(
    {
      title: c.seoTitle || c.subtitle || "Electronic Bell & Alarm",
      description: c.seoDescription || c.introduction,
      path: "/electronic-bell-alarm",
      image: c.heroImage || c.coverImageUrl,
    },
    await getPublicBusinessSettings(),
  );
}
