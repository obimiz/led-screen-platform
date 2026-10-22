import { redirect } from "next/navigation";
import { CategoryManager } from "@/components/products/category-manager";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { productTypes } from "@/lib/constants/products";
import { getCategoriesByType } from "@/services/products";
export const dynamic = "force-dynamic";
export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ productType?: string }>;
}) {
  const raw = (await searchParams).productType;
  const productType = productTypes.find((t) => t === raw) || "led-screen";
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const categories = await getCategoriesByType(productType, true);
  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-black">
        Product categories · {productType}
      </h1>
      <p className="mt-2 mb-7 text-slate-600">
        Create, order, and activate catalogue categories.
      </p>
      <CategoryManager
        key={productType}
        categories={categories}
        productType={productType}
      />
    </section>
  );
}
