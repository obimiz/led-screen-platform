import { requirePortfolioAdmin } from "@/lib/portfolio/access";
import { getPortfolioCategories } from "@/services/portfolio";
import { PortfolioProjectForm } from "@/components/portfolio/project-form";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requirePortfolioAdmin();
  const kind = (await searchParams).type === "project" ? "project" : "article";
  return (
    <main className="p-4 sm:p-6">
      <h1 className="mb-6 text-3xl font-black">
        {kind === "project" ? "Add completed project" : "Add blog article"}
      </h1>
      <PortfolioProjectForm
        initial={{ contentType: kind }}
        categories={await getPortfolioCategories(true)}
      />
    </main>
  );
}
