import { notFound } from "next/navigation";
import { requirePortfolioAdmin } from "@/lib/portfolio/access";
import {
  getPortfolioProjectById,
  getPortfolioCategories,
} from "@/services/portfolio";
import { PortfolioProjectForm } from "@/components/portfolio/project-form";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePortfolioAdmin();
  const [item, categories] = await Promise.all([
    getPortfolioProjectById((await params).id),
    getPortfolioCategories(true),
  ]);
  if (!item) notFound();
  return (
    <main className="p-4 sm:p-6">
      <h1 className="mb-6 text-3xl font-black">
        Edit {item.contentType === "article" ? "article" : "project"}
      </h1>
      <PortfolioProjectForm initial={item} categories={categories} />
    </main>
  );
}
