import type { MetadataRoute } from "next";
import { buildCanonicalUrl, isSearchIndexingAllowed } from "@/lib/seo/urls";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  return isSearchIndexingAllowed()
    ? {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/admin",
            "/api/",
            "/cart",
            "/checkout",
            "/orders/",
            "/payment/",
            "/quotation/",
            "/quotations/",
            "/rent-led-screen/request",
            "/led-installation/request",
            "/led-maintenance/request",
            "/electronic-bell-alarm/request",
          ],
        },
        sitemap: buildCanonicalUrl("/sitemap.xml"),
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
