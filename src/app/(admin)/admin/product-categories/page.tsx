import { redirect } from "next/navigation";
import { CategoryManager } from "@/components/products/category-manager";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getProductCategories } from "@/services/products";
export const dynamic = "force-dynamic";
export default async function CategoriesPage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const categories = await getProductCategories(true);
  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-black">LED product categories</h1>
      <p className="mt-2 mb-7 text-slate-600">
        Create, order, and activate catalogue categories.
      </p>
      <CategoryManager categories={categories} />
    </section>
  );
}
