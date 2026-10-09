import {
  Schema,
  model,
  models,
  type Model,
  type InferSchemaType,
} from "mongoose";
import {
  quotationStatuses,
  itemTypes,
  salesCurrencies,
} from "@/lib/sales/constants";
const text = { type: String, default: "", trim: true };
const money = { type: Number, min: 0, required: true };
const customer = new Schema(
  {
    name: { type: String, required: true },
    companyName: text,
    email: text,
    phone: text,
    whatsappNumber: text,
  },
  { _id: false },
);
const item = new Schema(
  {
    itemType: { type: String, enum: itemTypes, required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    name: { type: String, required: true },
    description: text,
    skuSnapshot: text,
    cataloguePriceSnapshot: { type: Number, default: null },
    quantity: { type: Number, min: 0.001, required: true },
    unit: { type: String, required: true },
    unitPrice: money,
    discount: money,
    lineTotal: money,
  },
  { _id: false },
);
const schema = new Schema(
  {
    quotationNumber: { type: String, required: true, unique: true },
    quoteRequestId: {
      type: Schema.Types.ObjectId,
      ref: "QuoteRequest",
      default: null,
    },
    rentalRequestId: { type: Schema.Types.ObjectId, ref: "RentalRequest", default: null },
    installationRequestId: { type: Schema.Types.ObjectId, ref: "InstallationRequest", default: null },
    maintenanceRequestId: { type: Schema.Types.ObjectId, ref: "MaintenanceRequest", default: null },
    maintenanceJobId: { type: Schema.Types.ObjectId, ref: "MaintenanceJob", default: null },
    bellAlarmRequestId: { type: Schema.Types.ObjectId, ref: "BellAlarmRequest", default: null },
    quotationType: { type: String, enum: ["sales", "rental", "installation", "maintenance", "bell-alarm"], default: "sales", required: true },
    customer: { type: customer, required: true },
    billingAddress: text,
    deliveryAddress: text,
    items: { type: [item], required: true },
    subtotal: money,
    discountType: {
      type: String,
      enum: ["none", "fixed", "percentage"],
      required: true,
    },
    discountValue: money,
    discountAmount: money,
    taxRate: { type: Number, min: 0, max: 100 },
    taxAmount: money,
    deliveryFee: money,
    installationFee: money,
    otherCharges: money,
    total: money,
    currency: { type: String, enum: salesCurrencies, required: true },
    notes: text,
    terms: text,
    validityDays: { type: Number, required: true, min: 1 },
    validUntil: { type: Date, required: true },
    status: {
      type: String,
      enum: quotationStatuses,
      required: true,
      default: "draft",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    acceptedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    convertedToSaleAt: { type: Date, default: null },
  },
  { timestamps: true, optimisticConcurrency: true },
);
schema.index({ status: 1, createdAt: -1 });
schema.index({ quoteRequestId: 1 });
schema.index({ rentalRequestId: 1 });
schema.index({ installationRequestId: 1 });
schema.index({ maintenanceRequestId: 1 });
schema.index({ bellAlarmRequestId: 1 });
schema.index({ maintenanceJobId: 1 });
export type QuotationDocument = InferSchemaType<typeof schema>;
export const Quotation =
  (models.Quotation as Model<QuotationDocument> | undefined) ??
  model<QuotationDocument>("Quotation", schema);
