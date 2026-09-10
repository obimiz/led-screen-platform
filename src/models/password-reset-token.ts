import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const passwordResetTokenSchema = new Schema(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type PasswordResetTokenDocument = InferSchemaType<
  typeof passwordResetTokenSchema
>;

export const PasswordResetToken =
  (models.PasswordResetToken as
    Model<PasswordResetTokenDocument> | undefined) ??
  model<PasswordResetTokenDocument>(
    "PasswordResetToken",
    passwordResetTokenSchema,
  );
