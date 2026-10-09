import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
const schema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true },
    logoUrl: { type: String, default: "" },
    location: { type: String, default: "" },
    website: { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
schema.index({ active: 1, featured: 1, displayOrder: 1 });
type Record = InferSchemaType<typeof schema>;
export const ClientOrganisation =
  (models.ClientOrganisation as Model<Record> | undefined) ||
  model<Record>("ClientOrganisation", schema);
