import {
  Schema,
  model,
  models,
  type Model,
  type InferSchemaType,
} from "mongoose";
import {
  customerTypes,
  projectTypes,
  enquiryStatuses,
  enquirySources,
  salesCurrencies,
} from "@/lib/sales/constants";
const optionalText = { type: String, default: "", trim: true };
const schema = new Schema(
  {
    referenceNumber: { type: String, unique: true, required: true },
    customerName: { type: String, required: true, maxlength: 100 },
    customerEmail: optionalText,
    customerPhone: optionalText,
    whatsappNumber: optionalText,
    companyName: optionalText,
    customerType: { type: String, enum: customerTypes, required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    productNameSnapshot: optionalText,
    productSlug: optionalText,
    projectType: { type: String, enum: projectTypes, required: true },
    intendedUse: optionalText,
    indoorOutdoor: optionalText,
    requiredWidth: { type: Number, min: 0 },
    requiredHeight: { type: Number, min: 0 },
    sizeUnit: { type: String, enum: ["m", "ft"] },
    quantity: { type: Number, min: 1, required: true },
    preferredPixelPitch: optionalText,
    installationLocation: optionalText,
    city: optionalText,
    state: optionalText,
    country: optionalText,
    eventDate: { type: Date, default: null },
    budget: { type: Number, min: 0 },
    budgetCurrency: { type: String, enum: salesCurrencies },
    message: optionalText,
    preferredContactMethod: {
      type: String,
      enum: ["phone", "whatsapp", "email"],
    },
    source: { type: String, enum: enquirySources, required: true },
    status: {
      type: String,
      enum: enquiryStatuses,
      default: "new",
      required: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
    adminNotes: optionalText,
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, optimisticConcurrency: true },
);
schema.index({ status: 1, createdAt: -1 });
schema.index({ assignedTo: 1, createdAt: -1 });
export type QuoteRequestDocument = InferSchemaType<typeof schema>;
export const QuoteRequest =
  (models.QuoteRequest as Model<QuoteRequestDocument> | undefined) ??
  model<QuoteRequestDocument>("QuoteRequest", schema);
