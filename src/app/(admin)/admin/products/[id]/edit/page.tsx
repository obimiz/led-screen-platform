import { notFound, redirect } from "next/navigation";
import { ProductForm } from "@/components/forms/product-form";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getLedProductById, getProductCategories } from "@/services/products";
export const dynamic = "force-dynamic";
export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const product = await getLedProductById((await params).id);
  if (!product) notFound();
  const categories = await getProductCategories(true);
  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-black">Edit {product.name}</h1>
      <p className="mt-2 mb-7 text-slate-600">
        Update catalogue information without changing its slug.
      </p>
      <ProductForm categories={categories} product={product} />
    </section>
  );
}
