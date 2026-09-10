import { redirect } from "next/navigation";
import { CategoryManager } from "@/components/products/category-manager";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getCategoriesByType } from "@/services/products";
export const dynamic = "force-dynamic";
export default async function AccessoryCategoriesPage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const categories = await getCategoriesByType("led-accessory", true);
  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-black">Accessory categories</h1>
      <p className="mt-2 mb-7 text-slate-600">
        Manage reusable categories for LED accessories and replacement parts.
      </p>
      <CategoryManager categories={categories} productType="led-accessory" />
    </section>
  );
}
