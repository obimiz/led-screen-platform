import { requireBellAlarmAdmin } from "@/lib/bell-alarm/access";
import { BellAlarmProductForm } from "@/components/bell-alarm/product-form";
import { getCategoriesByType } from "@/services/products";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireBellAlarmAdmin();
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-black">New electronic bell product</h1>
      <a
        className="text-brand-700 block underline"
        href="/admin/product-categories?productType=bell-alarm-system"
      >
        Manage bell product categories
      </a>
      <BellAlarmProductForm
        category=""
        categories={await getCategoriesByType("bell-alarm-system", true)}
      />
    </section>
  );
}
