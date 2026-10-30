import { Schema, model, models } from "mongoose";
import { galleryStatuses, galleryServices } from "@/lib/gallery/constants";
const schema = new Schema(
  {
    customerName: { type: String, default: "" },
    customerDisplayName: { type: String, required: true },
    organizationName: { type: String, default: "" },
    roleTitle: { type: String, default: "" },
    quote: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    customerImageUrl: { type: String, default: "" },
    organizationLogoUrl: { type: String, default: "" },
    serviceType: { type: String, enum: galleryServices, default: "general" },
    portfolioProjectId: {
      type: Schema.Types.ObjectId,
      ref: "PortfolioProject",
      default: null,
      index: true,
    },
    location: { type: String, default: "" },
    testimonialDate: { type: String, default: "" },
    source: { type: String, default: "" },
    consentConfirmed: { type: Boolean, default: false },
    featured: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: galleryStatuses,
      default: "draft",
      index: true,
    },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true },
);
export const Testimonial = models.Testimonial || model("Testimonial", schema);
