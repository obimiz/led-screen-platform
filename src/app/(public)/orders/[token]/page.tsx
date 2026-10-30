import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getOrderByPublicToken, formatOrderMoney } from "@/services/orders";
import { PayButton } from "@/components/payments/pay-button";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const token = (await params).token;
  const o = await getOrderByPublicToken(token);
  if (!o) return notFound();
  return (
    <main className="py-14">
      <Container>
        <h1 className="text-4xl font-black">Order received</h1>
        <p className="mt-3">
          Order number: <strong>{o.orderNumber}</strong>
        </p>
        <p className="mt-2">
          Status: {o.orderStatus} · Payment: {o.paymentStatus}
        </p>
        <div className="mt-8 rounded-xl border p-5">
          {o.items.map((i: any) => (
            <div
              key={`${i.slug}-${i.quantity}`}
              className="flex justify-between border-b py-3"
            >
              <span>
                {i.productName} × {i.quantity}
              </span>
              <span>{formatOrderMoney(i.lineTotal, o.currency)}</span>
            </div>
          ))}
          <p className="mt-4 text-right text-xl font-black">
            Total: {formatOrderMoney(o.total, o.currency)}
          </p>
        </div>
        {o.paymentStatus !== "paid" &&
          o.orderStatus !== "cancelled" &&
          o.total > 0 && (
            <div className="mt-6">
              <PayButton token={token} />
            </div>
          )}
        <Link href="/" className="text-brand-700 mt-6 inline-block font-bold">
          Continue shopping →
        </Link>
      </Container>
    </main>
  );
}
