import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductForm } from "@/components/forms/product-form";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getProductCategories } from "@/services/products";
export const dynamic = "force-dynamic";
export default async function NewProductPage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const categories = await getProductCategories(true);
  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-black">Create LED product</h1>
      <p className="mt-2 mb-7 text-slate-600">
        Add a screen to the product catalogue.
      </p>
      {categories.some((category) => category.active) ? (
        <ProductForm categories={categories} />
      ) : (
        <p className="rounded-xl bg-amber-50 p-5 text-amber-900">
          Create an active category before adding a product.{" "}
          <Link
            href="/admin/product-categories"
            className="font-semibold underline"
          >
            Manage categories
          </Link>
        </p>
      )}
    </section>
  );
}
