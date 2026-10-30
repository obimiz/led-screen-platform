import { apiSuccess, apiNotFound } from "@/lib/api/responses";
import { salesApi } from "@/lib/sales/api";
import { getPaymentById, verifyPayment } from "@/services/payments";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return salesApi(async () => {
    const p = await getPaymentById((await params).id);
    return p
      ? apiSuccess("Payment loaded", p)
      : apiNotFound("Payment not found.");
  });
}
export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return salesApi(async () => {
    const p = await getPaymentById((await params).id);
    if (!p) return apiNotFound("Payment not found.");
    return apiSuccess(
      "Payment verified",
      await verifyPayment(p.paymentReference),
    );
  });
}
