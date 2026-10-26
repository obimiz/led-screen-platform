import { redirect } from "next/navigation";
import { CategoryManager } from "@/components/products/category-manager";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getCategoriesByType } from "@/services/products";
export const dynamic = "force-dynamic";
export default async function AccessoryCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const categories = await getCategoriesByType("led-accessory", true);
  const feedback = await searchParams;
  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-black">Accessory categories</h1>
      <p className="mt-2 mb-7 text-slate-600">
        Manage reusable categories for LED accessories, video accessories,
        replacement parts and LED Screen Cameras.
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
      <CategoryManager categories={categories} productType="led-accessory" />
    </section>
  );
}
