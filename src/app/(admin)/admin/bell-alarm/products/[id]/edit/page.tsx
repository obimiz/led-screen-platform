import { requireBellAlarmAdmin } from "@/lib/bell-alarm/access";
import { BellAlarmProductForm } from "@/components/bell-alarm/product-form";
import { getCategoriesByType } from "@/services/products";
import { getBellAlarmProductById } from "@/services/bell-alarm";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireBellAlarmAdmin();
  const product = await getBellAlarmProductById((await params).id, true);
  if (!product) notFound();
  const initial = JSON.parse(JSON.stringify(product));
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-black">Edit bell/alarm product</h1>
      <BellAlarmProductForm
        id={product.id}
        category={String(product.category)}
        initial={initial}
        categories={await getCategoriesByType(product.productType)}
      />
    </section>
  );
}
