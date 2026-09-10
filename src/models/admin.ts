import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

export const adminRoles = ["owner", "admin"] as const;
export type AdminRole = (typeof adminRoles)[number];

const adminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: adminRoles, default: "admin", required: true },
    isActive: { type: Boolean, default: true, required: true },
    sessionVersion: { type: Number, default: 0, required: true, select: false },
  },
  { timestamps: true },
);

export type AdminDocument = InferSchemaType<typeof adminSchema>;

export const Admin =
  (models.Admin as Model<AdminDocument> | undefined) ??
  model<AdminDocument>("Admin", adminSchema);
