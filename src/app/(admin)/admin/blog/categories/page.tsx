import Link from "next/link";
import { requirePortfolioAdmin } from "@/lib/portfolio/access";
import { getPortfolioCategories } from "@/services/portfolio";
import { PublishingCategories } from "@/components/publishing/categories";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requirePortfolioAdmin();
  return (
    <main className="max-w-5xl space-y-6 p-4 sm:p-6">
      <h1 className="text-3xl font-black">Blog & Project Categories</h1>
      <Link className="inline-block underline" href="/admin/blog">
        Back to posts
      </Link>
      <PublishingCategories categories={await getPortfolioCategories(true)} />
    </main>
  );
}
