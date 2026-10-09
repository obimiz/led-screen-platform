import "server-only";
import crypto from "node:crypto";
import { Types, startSession } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Product } from "@/models/product";
import { Order } from "@/models/order";
import { SalesCounter } from "@/models/sales-counter";
import { majorToMinor, formatMoney } from "@/lib/sales/calculations";
import { checkoutSchema, type CheckoutValues } from "@/lib/validations/orders";
import { SalesError } from "@/lib/sales/calculations";
import { emitDomainEvent } from "@/services/notifications";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
async function nextNumber() {
  const year = new Date().getFullYear();
  const c = await SalesCounter.findOneAndUpdate(
    { _id: `orders-${year}` },
    { $inc: { value: 1 } },
    { upsert: true, new: true },
  );
  return `ORD-${year}-${String(c.value).padStart(5, "0")}`;
}
function safeOrder(o: any, includePrivate = false) {
  const x = o.toObject ? o.toObject() : o;
  return {
    id: includePrivate ? String(x._id) : undefined,
    orderNumber: x.orderNumber,
    customerName: x.customerName,
    customerEmail: includePrivate ? x.customerEmail : undefined,
    customerPhone: includePrivate ? x.customerPhone : undefined,
    fulfilmentMethod: x.fulfilmentMethod,
    deliveryAddress: includePrivate ? x.deliveryAddress : undefined,
    city: x.city,
    state: x.state,
    country: x.country,
    items: x.items.map((item: any) =>
      includePrivate
        ? { ...item, productId: String(item.productId) }
        : {
            productName: item.productName,
            slug: item.slug,
            productType: item.productType,
            sku: item.sku,
            imageUrl: item.imageUrl,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
            currency: item.currency,
          },
    ),
    subtotal: x.subtotal,
    discount: x.discount,
    deliveryFee: x.deliveryFee,
    tax: x.tax,
    total: x.total,
    currency: x.currency,
    paymentStatus: x.paymentStatus,
    paymentMethod: includePrivate ? x.paymentMethod : undefined,
    orderStatus: x.orderStatus,
    customerNote: includePrivate ? x.customerNote : undefined,
    createdAt: x.createdAt,
    updatedAt: x.updatedAt,
  };
}
export async function createOrder(raw: unknown) {
  const input = checkoutSchema.parse(raw) as CheckoutValues;
  await connectToDatabase();
  const existing = await Order.findOne({
    idempotencyKey: input.idempotencyKey,
    customerEmail: input.customerEmail,
  });
  if (existing) return { order: safeOrder(existing), token: "" };
  const ids = input.items.map((i) => new Types.ObjectId(i.productId));
  const products = await Product.find({
    _id: { $in: ids },
    status: "published",
  });
  if (products.length !== ids.length)
    throw new SalesError("One or more products are no longer available.");
  const items = input.items.map((i) => {
    const p = products.find((x) => x.id === i.productId);
    if (
      !p ||
      p.priceType !== "fixed" ||
      !p.isPurchasableOnline ||
      p.price === null
    )
      throw new SalesError("One or more products cannot be purchased online.");
    if (
      i.quantity < (p.minOrderQuantity || 1) ||
      (p.maxOrderQuantity && i.quantity > p.maxOrderQuantity)
    )
      throw new SalesError(
        `Quantity for ${p.name} is outside the allowed range.`,
      );
    if (p.trackInventory && !p.allowBackorder && p.quantity < i.quantity)
      throw new SalesError(
        `${p.name} is no longer available in the requested quantity.`,
      );
    const unit = majorToMinor(p.price ?? 0);
    return {
      productId: p._id,
      productName: p.name,
      slug: p.slug,
      productType: p.productType,
      sku: p.sku || "",
      imageUrl: p.featuredImageUrl || p.imageUrls[0] || "",
      quantity: i.quantity,
      unitPrice: unit,
      lineTotal: unit * i.quantity,
      currency: p.currency,
    };
  });
  const subtotal = items.reduce((n, i) => n + i.lineTotal, 0);
  const token = crypto.randomBytes(32).toString("hex");
  const order = await Order.create({
    orderNumber: await nextNumber(),
    publicTokenHash: hashToken(token),
    idempotencyKey: input.idempotencyKey,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    whatsappNumber: input.whatsappNumber,
    fulfilmentMethod: input.fulfilmentMethod,
    deliveryAddress: input.deliveryAddress,
    city: input.city,
    state: input.state,
    country: input.country,
    deliveryNotes: input.deliveryNotes,
    items,
    subtotal,
    total: subtotal,
    currency: items[0]?.currency || "NGN",
    customerNote: input.customerNote,
    statusHistory: [{ status: "pending", note: "Order received" }],
  });
  void emitDomainEvent({
    type: "order.created",
    payload: {
      orderNumber: order.orderNumber,
      entityType: "order",
      entityId: order.id,
      actionUrl: `/admin/orders/${order.id}`,
    },
  }).catch(() => {});
  return { order: safeOrder(order), token };
}
export async function getOrderByPublicToken(token: string) {
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  await connectToDatabase();
  const o = await Order.findOne({ publicTokenHash: hashToken(token) });
  return o ? safeOrder(o) : null;
}
export async function getOrderById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const o = await Order.findById(id);
  return o ? safeOrder(o, true) : null;
}
export async function getOrders() {
  await connectToDatabase();
  return (await Order.find().sort({ createdAt: -1 }).limit(300)).map((o) =>
    safeOrder(o, true),
  );
}
export async function updateOrderStatus(
  id: string,
  status: string,
  adminId: string,
  note = "",
) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const o = await Order.findById(id);
  if (!o) return null;
  if (status === "confirmed" && !o.inventoryDeducted) {
    const session = await startSession();
    try {
      session.startTransaction();
      for (const item of o.items) {
        const p = await Product.findById(item.productId).session(session);
        if (p?.trackInventory && !p.allowBackorder) {
          const result = await Product.updateOne(
            { _id: p._id, quantity: { $gte: item.quantity } },
            { $inc: { quantity: -item.quantity } },
            { session },
          );
          if (result.modifiedCount !== 1)
            throw new SalesError(`${item.productName} is no longer available.`);
        }
      }
      o.inventoryDeducted = true;
      o.orderStatus = status;
      o.updatedBy = new Types.ObjectId(adminId);
      o.statusHistory.push({
        status,
        changedBy: new Types.ObjectId(adminId),
        note,
      } as any);
      await o.save({ session });
      await session.commitTransaction();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
  } else {
    o.orderStatus = status as any;
    o.updatedBy = new Types.ObjectId(adminId);
    o.statusHistory.push({
      status,
      changedBy: new Types.ObjectId(adminId),
      note,
    } as any);
    if (status === "cancelled") {
      o.cancelledAt = new Date();
      if (o.inventoryDeducted && !o.inventoryRestoredAt) {
        for (const item of o.items)
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { quantity: item.quantity } },
          );
        o.inventoryRestoredAt = new Date();
      }
    }
    await o.save();
  }
  return safeOrder(o, true);
}
export async function updatePaymentStatus(
  id: string,
  paymentStatus: string,
  paymentMethod: string | undefined,
  reference: string,
  adminId: string,
) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const current = await Order.findById(id);
  if (!current) return null;
  if (
    current.paymentStatus === "paid" &&
    !(["paid", "refunded"] as string[]).includes(paymentStatus)
  )
    throw new SalesError(
      "A paid order cannot be downgraded through manual status updates.",
    );
  if (paymentStatus === "paid" && paymentMethod === "online")
    throw new SalesError(
      "Online payments must be verified by the payment provider.",
    );
  const o = await Order.findByIdAndUpdate(
    id,
    {
      $set: {
        paymentStatus,
        paymentMethod: paymentMethod || "",
        paymentReference: reference,
        updatedBy: adminId,
      },
    },
    { new: true, runValidators: true },
  );
  return o ? safeOrder(o, true) : null;
}
export function formatOrderMoney(amount: number, currency: string) {
  return formatMoney(amount, currency);
}
