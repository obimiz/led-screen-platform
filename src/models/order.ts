import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
const itemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    productName: { type: String, required: true },
    slug: { type: String, required: true },
    productType: { type: String, required: true },
    sku: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    quantity: { type: Number, min: 1, required: true },
    unitPrice: { type: Number, min: 0, required: true },
    lineTotal: { type: Number, min: 0, required: true },
    currency: { type: String, required: true },
  },
  { _id: false },
);
const historySchema = new Schema(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
    note: { type: String, default: "" },
  },
  { _id: false },
);
const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    publicTokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    idempotencyKey: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, index: true },
    customerPhone: { type: String, required: true, index: true },
    whatsappNumber: { type: String, default: "" },
    fulfilmentMethod: {
      type: String,
      enum: ["delivery", "pickup", "arrange-with-us"],
      required: true,
    },
    deliveryAddress: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    deliveryNotes: { type: String, default: "" },
    items: { type: [itemSchema], required: true },
    subtotal: { type: Number, min: 0, required: true },
    discount: { type: Number, min: 0, default: 0 },
    deliveryFee: { type: Number, min: 0, default: 0 },
    deliveryFeeStatus: { type: String, default: "pending-confirmation" },
    tax: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, required: true },
    currency: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: [
        "unpaid",
        "pending",
        "paid",
        "partially-paid",
        "failed",
        "refunded",
        "cancelled",
      ],
      default: "unpaid",
      index: true,
    },
    paymentMethod: { type: String, default: "" },
    paymentReference: { type: String, default: "" },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "ready-for-pickup",
        "dispatched",
        "delivered",
        "completed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    customerNote: { type: String, default: "" },
    adminNotes: { type: String, default: "" },
    source: { type: String, default: "website" },
    inventoryDeducted: { type: Boolean, default: false },
    inventoryRestoredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: "" },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
    statusHistory: { type: [historySchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true },
);
orderSchema.index({ createdAt: -1 });
orderSchema.index({ idempotencyKey: 1, customerEmail: 1 }, { unique: true });
export type OrderDocument = InferSchemaType<typeof orderSchema>;
export const Order =
  (models.Order as Model<OrderDocument> | undefined) ??
  model<OrderDocument>("Order", orderSchema);
