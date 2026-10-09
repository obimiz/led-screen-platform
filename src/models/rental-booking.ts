import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import {
  bookingStatuses,
  operationalStatuses,
  depositStatuses,
} from "@/lib/rentals/constants";
const text = { type: String, default: "", trim: true };
const money = { type: Number, min: 0, required: true };
const schema = new Schema(
  {
    bookingNumber: { type: String, required: true, unique: true },
    rentalRequestId: {
      type: Schema.Types.ObjectId,
      ref: "RentalRequest",
      default: null,
    },
    quotationId: {
      type: Schema.Types.ObjectId,
      ref: "Quotation",
      default: null,
    },
    customerSnapshot: {
      name: { type: String, required: true },
      companyName: text,
      email: text,
      phone: text,
      whatsappNumber: text,
    },
    eventSnapshot: {
      eventType: String,
      eventName: text,
      startDate: Date,
      endDate: Date,
    },
    equipment: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: String,
        sku: text,
        quantity: { type: Number, min: 1 },
        dailyRate: money,
        rentalDays: { type: Number, min: 1 },
        lineTotal: money,
      },
    ],
    services: [
      {
        name: String,
        description: text,
        quantity: Number,
        unitPrice: money,
        lineTotal: money,
      },
    ],
    bookingStart: { type: Date, required: true, index: true },
    bookingEnd: { type: Date, required: true, index: true },
    setupDateTime: Date,
    teardownDateTime: Date,
    venue: text,
    subtotal: money,
    depositRequired: Boolean,
    depositAmount: money,
    depositStatus: { type: String, enum: depositStatuses },
    total: money,
    amountPaid: money,
    balanceDue: money,
    currency: String,
    bookingStatus: {
      type: String,
      enum: bookingStatuses,
      default: "draft",
      index: true,
    },
    operationalStatus: {
      type: String,
      enum: operationalStatuses,
      default: "preparing",
      index: true,
    },
    notes: text,
    assignedStaff: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true, optimisticConcurrency: true },
);
schema.index({ bookingStart: 1, bookingEnd: 1, bookingStatus: 1 });
export type RentalBookingDocument = InferSchemaType<typeof schema>;
export const RentalBooking =
  (models.RentalBooking as Model<RentalBookingDocument> | undefined) ??
  model<RentalBookingDocument>("RentalBooking", schema);
