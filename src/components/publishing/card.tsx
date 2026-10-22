import Image from "next/image";
import Link from "next/link";
export type PublishingEntry = {
  id: string;
  title: string;
  slug: string;
  contentType?: string;
  shortDescription?: string;
  description?: string;
  richContent?: unknown;
  coverImageUrl?: string;
  coverAlt?: string;
  categoryId?: { name?: string; slug?: string } | string | null;
  author?: string;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  clientName?: string;
  customerName?: string;
  customerDisplayName?: string;
  hideCustomerName?: boolean;
  city?: string;
  state?: string;
  country?: string;
  venueName?: string;
  completionDate?: string;
  servicesProvided?: string[];
  productsUsed?: string[];
  imageUrls?: string[];
  imageAlts?: string[];
  videoUrl?: string;
  challenge?: string;
  solution?: string;
  outcome?: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: string;
};
export function ContentCard({ item }: { item: PublishingEntry }) {
  const article = item.contentType === "article",
    path = `/${article ? "blog" : "projects"}/${item.slug}`,
    category = typeof item.categoryId === "object" ? item.categoryId?.name : "";
  const date = item.publishedAt || item.createdAt;
  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm">
      <Link href={path} className="bg-brand-50 relative block aspect-[16/10]">
        {item.coverImageUrl ? (
          <Image
            src={item.coverImageUrl}
            alt={item.coverAlt || item.title}
            fill
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
            unoptimized={!item.coverImageUrl.startsWith("/")}
            className="object-cover"
          />
        ) : (
          <span className="text-brand-700 grid h-full place-items-center text-lg font-bold">
            {article ? "Insights" : "Completed project"}
          </span>
        )}
      </Link>
      <div className="space-y-3 p-5">
        <p className="text-brand-700 text-xs font-bold tracking-wide uppercase">
          {category || (article ? "Article" : "Project")}
        </p>
        <h2 className="text-xl font-bold break-words">
          <Link href={path}>{item.title}</Link>
        </h2>
        {article && date && (
          <p className="text-sm text-slate-500">
            <time dateTime={date}>
              {new Date(date).toLocaleDateString("en-GB", {
                timeZone: "UTC",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </p>
        )}
        {!article && (item.clientName || item.city || item.state) && (
          <p className="text-sm text-slate-600">
            {[item.clientName, item.city, item.state]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <p className="text-sm leading-6 text-slate-600">
          {item.shortDescription}
        </p>
        <Link
          href={path}
          className="bg-primary inline-block rounded-lg px-4 py-2 font-bold text-white"
        >
          {article ? "Read Article" : "View Project"}
        </Link>
      </div>
    </article>
  );
}
