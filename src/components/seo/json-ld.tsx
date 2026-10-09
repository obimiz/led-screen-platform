import { serializeJsonLd, type JsonLdData } from "@/lib/seo/structured-data";
export function JsonLd({ data }: { data: JsonLdData | null }) {
  return data ? (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  ) : null;
}
