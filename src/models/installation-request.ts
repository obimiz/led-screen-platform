import { Schema, model, models } from "mongoose";
import {
  installationRequestStatuses,
  installationTypes,
  intendedUses,
} from "@/lib/installations/constants";
const t = { type: String, default: "", trim: true };
const schema = new Schema(
  {
    referenceNumber: { type: String, unique: true, required: true },
    customerName: { type: String, required: true, trim: true },
    companyName: t,
    customerType: t,
    customerEmail: t,
    customerPhone: t,
    whatsappNumber: t,
    projectName: t,
    projectDescription: t,
    installationType: {
      type: String,
      enum: installationTypes,
      default: "custom",
    },
    intendedUse: { type: String, enum: intendedUses, default: "other" },
    indoorOutdoor: t,
    selectedProductId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    productNameSnapshot: t,
    requiredWidth: Number,
    requiredHeight: Number,
    sizeUnit: t,
    preferredPixelPitch: t,
    quantity: { type: Number, default: 1, min: 1 },
    venueName: t,
    address: t,
    city: t,
    state: t,
    country: t,
    buildingType: t,
    mountingLocation: t,
    mountingHeight: Number,
    structureAvailable: t,
    powerAvailable: t,
    internetRequired: Boolean,
    controlRoomAvailable: t,
    preferredInstallationDate: t,
    budget: Number,
    budgetCurrency: t,
    preferredContactMethod: t,
    message: t,
    source: t,
    status: { type: String, enum: installationRequestStatuses, default: "new" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
    quotationId: {
      type: Schema.Types.ObjectId,
      ref: "Quotation",
      default: null,
    },
    siteAssessmentId: {
      type: Schema.Types.ObjectId,
      ref: "SiteAssessment",
      default: null,
    },
    adminNotes: t,
  },
  { timestamps: true, optimisticConcurrency: true },
);
schema.index({ status: 1, createdAt: -1 });
export const InstallationRequest =
  models.InstallationRequest || model("InstallationRequest", schema);
