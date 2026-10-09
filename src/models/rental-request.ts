import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { rentalStatuses, rentalEventTypes } from "@/lib/rentals/constants";
const text = { type: String, default: "", trim: true };
const schema = new Schema(
  {
    referenceNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerEmail: text,
    customerPhone: text,
    whatsappNumber: text,
    companyName: text,
    customerType: String,
    eventType: { type: String, enum: rentalEventTypes, required: true },
    eventTypeOther: text,
    eventName: text,
    eventDescription: text,
    expectedAudience: Number,
    eventStartDate: { type: Date, required: true },
    eventEndDate: { type: Date, required: true },
    setupDate: Date,
    teardownDate: Date,
    eventStartTime: text,
    eventEndTime: text,
    venueName: text,
    venueAddress: text,
    city: text,
    state: text,
    country: text,
    indoorOutdoor: text,
    requiredWidth: Number,
    requiredHeight: Number,
    sizeUnit: String,
    quantity: { type: Number, required: true, min: 1 },
    preferredPixelPitch: text,
    selectedProductId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    productNameSnapshot: text,
    accessoriesRequested: text,
    installationSupportRequired: Boolean,
    operatorRequired: Boolean,
    generatorPowerRequired: Boolean,
    transportationRequired: Boolean,
    budget: Number,
    budgetCurrency: String,
    preferredContactMethod: String,
    message: text,
    source: { type: String, default: "website" },
    status: { type: String, enum: rentalStatuses, default: "new" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
    quotationId: {
      type: Schema.Types.ObjectId,
      ref: "Quotation",
      default: null,
    },
    adminNotes: text,
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, optimisticConcurrency: true },
);
schema.index({ status: 1, eventStartDate: 1 });
schema.index({ assignedTo: 1, createdAt: -1 });
export type RentalRequestDocument = InferSchemaType<typeof schema>;
export const RentalRequest =
  (models.RentalRequest as Model<RentalRequestDocument> | undefined) ??
  model<RentalRequestDocument>("RentalRequest", schema);
