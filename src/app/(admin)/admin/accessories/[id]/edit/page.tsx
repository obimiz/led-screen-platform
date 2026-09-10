import { notFound, redirect } from "next/navigation";
import { AccessoryForm } from "@/components/forms/accessory-form";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getAccessoryById, getCategoriesByType } from "@/services/products";
export const dynamic = "force-dynamic";
export default async function EditAccessoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const accessory = await getAccessoryById((await params).id);
  if (!accessory) notFound();
  const categories = await getCategoriesByType("led-accessory", true);
  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-black">Edit {accessory.name}</h1>
      <p className="mt-2 mb-7 text-slate-600">
        Update accessory information without changing its slug.
      </p>
      <AccessoryForm categories={categories} accessory={accessory} />
    </section>
  );
}
