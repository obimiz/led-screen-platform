import { notFound } from "next/navigation";
import { requireSalesAdmin } from "@/lib/sales/access";
import { getOrderById, formatOrderMoney } from "@/services/orders";
import { getPaymentsForOrder } from "@/services/payments";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSalesAdmin();
  const id = (await params).id;
  const o = await getOrderById(id);
  if (!o) return notFound();
  const payments = await getPaymentsForOrder(id);
  return (
    <main className="p-6">
      <h1 className="text-3xl font-black">{o.orderNumber}</h1>
      <p className="mt-2 text-slate-600">
        {o.customerName} · {o.customerEmail} · {o.customerPhone}
      </p>
      <p className="mt-4">
        Status: {o.orderStatus} · Payment: {o.paymentStatus}
      </p>
      <div className="mt-8 rounded-xl border p-5">
        {o.items.map((i: any) => (
          <div key={i.productId} className="flex justify-between border-b py-3">
            <span>
              {i.productName} × {i.quantity}
            </span>
            <span>{formatOrderMoney(i.lineTotal, o.currency)}</span>
          </div>
        ))}
        <p className="mt-4 text-right font-black">
          {formatOrderMoney(o.total, o.currency)}
        </p>
      </div>
      <h2 className="mt-8 text-xl font-black">Payment attempts</h2>
      <div className="mt-3 space-y-2">
        {payments.map((p: any) => (
          <div key={p.id} className="rounded-lg border p-3">
            {p.paymentReference} · {p.status} ·{" "}
            {formatOrderMoney(p.amount, p.currency)}
          </div>
        ))}
        {!payments.length && (
          <p className="text-sm text-slate-500">No payment attempts.</p>
        )}
      </div>
    </main>
  );
}
