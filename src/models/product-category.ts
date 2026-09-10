import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { productTypes } from "@/lib/constants/products";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true, default: "" },
    productType: {
      type: String,
      enum: productTypes,
      required: true,
      default: "led-screen",
    },
    imageUrl: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);
categorySchema.index({ productType: 1, slug: 1 }, { unique: true });
categorySchema.index({ productType: 1, active: 1, sortOrder: 1 });
export type ProductCategoryDocument = InferSchemaType<typeof categorySchema>;
export const ProductCategory =
  (models.ProductCategory as Model<ProductCategoryDocument> | undefined) ??
  model<ProductCategoryDocument>("ProductCategory", categorySchema);
