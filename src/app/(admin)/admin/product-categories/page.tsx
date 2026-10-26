import Link from "next/link";
import { redirect } from "next/navigation";
import { CategoryManager } from "@/components/products/category-manager";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { productTypes } from "@/lib/constants/products";
import { getCategoriesByType } from "@/services/products";
export const dynamic = "force-dynamic";
export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    productType?: string;
    saved?: string;
    error?: string;
  }>;
}) {
  const feedback = await searchParams;
  const raw = feedback.productType;
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
      {feedback.saved === "1" && (
        <p
          role="status"
          className="mb-5 rounded-lg bg-green-50 p-3 text-green-800"
        >
          Category saved.
        </p>
      )}
      {feedback.error && (
        <p role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-red-700">
          {feedback.error === "invalid"
            ? "Check the category name, image URL and sort order, then try again."
            : "The category could not be saved. Please try again."}
        </p>
      )}
      <nav aria-label="Category types" className="mb-6 flex flex-wrap gap-3">
        {productTypes.map((type) => (
          <Link
            key={type}
            href={`/admin/product-categories?productType=${type}`}
            aria-current={type === productType ? "page" : undefined}
            className={`rounded-lg border px-4 py-2 font-semibold ${type === productType ? "bg-brand-900 text-white" : "bg-white"}`}
          >
            {
              {
                "led-screen": "LED Screen Categories",
                "led-accessory": "LED Accessory Categories",
                "bell-alarm-system": "Bell & Alarm Categories",
                "bell-alarm-accessory": "Bell & Alarm Accessory Categories",
              }[type]
            }
          </Link>
        ))}
      </nav>
      <CategoryManager
        key={productType}
        categories={categories}
        productType={productType}
      />
    </section>
  );
}
