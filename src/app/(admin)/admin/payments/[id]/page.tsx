import { notFound } from "next/navigation";
import { requireSalesAdmin } from "@/lib/sales/access";
import { getPaymentById } from "@/services/payments";
import { formatOrderMoney } from "@/services/orders";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSalesAdmin();
  const p = await getPaymentById((await params).id);
  if (!p) return notFound();
  return (
    <main className="p-6">
      <h1 className="text-3xl font-black">{p.paymentReference}</h1>
      <dl className="mt-8 grid max-w-xl gap-3 rounded-xl border p-5">
        <div>
          <dt className="text-sm text-slate-500">Order</dt>
          <dd>{p.orderNumber}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Amount</dt>
          <dd>{formatOrderMoney(p.amount, p.currency)}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Provider / channel</dt>
          <dd>
            {p.provider} · {p.channel || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Status</dt>
          <dd>{p.status}</dd>
        </div>
      </dl>
    </main>
  );
}
