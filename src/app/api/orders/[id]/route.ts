import { apiSuccess, apiNotFound } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import {
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
} from "@/services/orders";
import {
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
} from "@/lib/validations/orders";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return salesApi(async () => {
    const x = await getOrderById((await params).id);
    return x ? apiSuccess("Order loaded", x) : apiNotFound("Order not found.");
  });
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return salesApi(async (admin) => {
    const body = (await salesBody(request)) as any;
    if (body.paymentStatus) {
      const p = updatePaymentStatusSchema.parse(body);
      const x = await updatePaymentStatus(
        (await params).id,
        p.paymentStatus,
        p.paymentMethod,
        p.paymentReference,
        admin.id,
      );
      return x
        ? apiSuccess("Payment status updated", x)
        : apiNotFound("Order not found.");
    }
    const s = updateOrderStatusSchema.parse(body);
    const x = await updateOrderStatus(
      (await params).id,
      s.status,
      admin.id,
      s.note,
    );
    return x
      ? apiSuccess("Order status updated", x)
      : apiNotFound("Order not found.");
  });
}
