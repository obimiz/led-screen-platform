import {
  Schema,
  model,
  models,
  type Model,
  type InferSchemaType,
} from "mongoose";
const schema = new Schema(
  {
    data: { type: Buffer, required: true, select: false },
    contentType: {
      type: String,
      required: true,
      enum: ["image/png", "image/jpeg", "image/webp"],
    },
    name: { type: String, required: true, maxlength: 200 },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true },
);
export const ProductImageAsset =
  (models.ProductImageAsset as
    Model<InferSchemaType<typeof schema>> | undefined) ??
  model<InferSchemaType<typeof schema>>("ProductImageAsset", schema);
