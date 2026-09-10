import { redirect } from "next/navigation";
import { AccessoryForm } from "@/components/forms/accessory-form";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getCategoriesByType } from "@/services/products";
export const dynamic = "force-dynamic";
export default async function NewAccessoryPage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const categories = await getCategoriesByType("led-accessory", true);
  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-black">Create LED accessory</h1>
      <p className="mt-2 mb-7 text-slate-600">
        Add replacement parts or related LED equipment.
      </p>
      {categories.some((item) => item.active) ? (
        <AccessoryForm categories={categories} />
      ) : (
        <p className="rounded-xl bg-amber-50 p-5 text-amber-900">
          Create an active accessory category first.
        </p>
      )}
    </section>
  );
}
