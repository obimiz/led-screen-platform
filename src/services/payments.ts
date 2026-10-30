import "server-only";
import crypto from "node:crypto";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Order } from "@/models/order";
import { Payment } from "@/models/payment";
import { SalesCounter } from "@/models/sales-counter";
import { initializePaystack, verifyPaystack } from "@/lib/payments/paystack";
import { updateOrderStatus } from "@/services/orders";
import { SalesError } from "@/lib/sales/calculations";
import { emitDomainEvent } from "@/services/notifications";

const systemActor = () => new Types.ObjectId().toString();
async function reference() {
  const year = new Date().getFullYear();
  const c = await SalesCounter.findOneAndUpdate(
    { _id: `payments-${year}` },
    { $inc: { value: 1 } },
    { upsert: true, new: true },
  );
  return `PAY-${year}-${String(c.value).padStart(5, "0")}-${crypto.randomBytes(3).toString("hex")}`;
}
function dto(p: any) {
  const x = p.toObject ? p.toObject() : p;
  return {
    id: String(x._id),
    paymentReference: x.paymentReference,
    provider: x.provider,
    providerReference: x.providerReference,
    orderId: String(x.orderId),
    orderNumber: x.orderNumber,
    customerName: x.customerName,
    amount: x.amount,
    currency: x.currency,
    status: x.status,
    channel: x.channel,
    authorizationUrl: x.authorizationUrl,
    initiatedAt: x.initiatedAt,
    verifiedAt: x.verifiedAt,
    paidAt: x.paidAt,
    webhookProcessedAt: x.webhookProcessedAt,
  };
}
export async function initializeOrderPayment(token: string) {
  await connectToDatabase();
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const order = await Order.findOne({ publicTokenHash: hash });
  if (!order) throw new SalesError("Order not found.", 404);
  if (order.orderStatus === "cancelled")
    throw new SalesError("Cancelled orders cannot be paid.");
  if (order.paymentStatus === "paid")
    throw new SalesError("This order has already been paid.");
  if (order.total <= 0)
    throw new SalesError("This order does not require online payment.");
  if (order.currency !== "NGN")
    throw new SalesError(
      "Online payment is currently available for NGN orders only.",
    );
  const pay = await Payment.create({
    paymentReference: await reference(),
    provider: "paystack",
    orderId: order._id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    amount: order.total,
    currency: order.currency,
    status: "initialized",
    metadata: { orderTokenHash: hash },
  });
  try {
    const result = await initializePaystack({
      email: order.customerEmail,
      amount: order.total,
      currency: order.currency,
      reference: pay.paymentReference,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/callback`,
    });
    pay.authorizationUrl = result.authorization_url || "";
    pay.accessCode = result.access_code || "";
    pay.status = "pending";
    await pay.save();
    order.paymentStatus = "pending";
    order.paymentReference = pay.paymentReference;
    await order.save();
    return {
      authorizationUrl: pay.authorizationUrl,
      reference: pay.paymentReference,
      provider: "paystack",
    };
  } catch {
    pay.status = "pending";
    await pay.save();
    throw new SalesError("Unable to start payment. Please try again.", 502);
  }
}
export async function verifyPayment(referenceValue: string) {
  await connectToDatabase();
  const pay = await Payment.findOne({ paymentReference: referenceValue });
  if (!pay) throw new SalesError("Payment reference not found.", 404);
  if (pay.status === "successful") return dto(pay);
  let result: any;
  try {
    result = await verifyPaystack(referenceValue);
  } catch {
    throw new SalesError("We could not verify this payment yet.", 502);
  }
  const order = await Order.findById(pay.orderId);
  if (!order) throw new SalesError("Order not found.", 404);
  pay.verifiedAt = new Date();
  pay.providerReference = String(result?.id || "");
  pay.channel = result?.channel || "";
  pay.providerResponse = {
    status: result?.status,
    amount: result?.amount,
    currency: result?.currency,
    channel: result?.channel,
  };
  if (result?.status !== "success") {
    pay.status = "failed";
    pay.failedAt = new Date();
    order.paymentStatus = "failed";
    await pay.save();
    await order.save();
    return dto(pay);
  }
  if (
    Number(result.amount) !== order.total ||
    String(result.currency).toUpperCase() !== order.currency
  ) {
    pay.status = "mismatch";
    await pay.save();
    throw new SalesError("Payment amount or currency could not be verified.");
  }
  pay.status = "successful";
  pay.paidAt = new Date();
  await pay.save();
  order.paymentStatus = "paid";
  await order.save();
  void emitDomainEvent({
    type: "payment.successful",
    payload: {
      orderNumber: order.orderNumber,
      entityType: "payment",
      entityId: pay.id,
      actionUrl: `/admin/payments/${pay.id}`,
    },
  }).catch(() => {});
  if (order.orderStatus !== "cancelled" && !order.inventoryDeducted)
    await updateOrderStatus(
      order.id,
      "confirmed",
      systemActor(),
      "Confirmed after verified online payment",
    );
  return dto(pay);
}
export async function getPayments() {
  await connectToDatabase();
  return (await Payment.find().sort({ createdAt: -1 }).limit(300)).map(dto);
}
export async function getPaymentById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const p = await Payment.findById(id);
  return p ? dto(p) : null;
}
export async function getPaymentsForOrder(orderId: string) {
  if (!Types.ObjectId.isValid(orderId)) return [];
  await connectToDatabase();
  return (await Payment.find({ orderId }).sort({ createdAt: -1 })).map(dto);
}
