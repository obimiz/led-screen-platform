import { type NextRequest } from "next/server";

import {
  apiBadRequest,
  apiRateLimitError,
  apiServerError,
  apiSuccess,
  apiValidationError,
} from "@/lib/api/responses";
import { hashPassword } from "@/lib/auth/password";
import { checkRateLimit, getRequestIdentifier } from "@/lib/auth/rate-limit";
import { hashResetToken } from "@/lib/auth/reset-token";
import { connectToDatabase } from "@/lib/db/mongoose";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { Admin } from "@/models/admin";
import { PasswordResetToken } from "@/models/password-reset-token";

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(
    `reset:${getRequestIdentifier(request)}`,
    5,
    15 * 60_000,
  );
  if (!rateLimit.allowed) return apiRateLimitError(rateLimit.retryAfter);

  try {
    const parsed = resetPasswordSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    await connectToDatabase();
    const resetRecord = await PasswordResetToken.findOneAndUpdate(
      {
        tokenHash: hashResetToken(parsed.data.token),
        usedAt: null,
        expiresAt: { $gt: new Date() },
      },
      { $set: { usedAt: new Date() } },
      { new: true },
    );

    if (!resetRecord)
      return apiBadRequest(
        "This password reset link is invalid or has expired.",
      );

    const passwordHash = await hashPassword(parsed.data.password);
    const admin = await Admin.findOneAndUpdate(
      { _id: resetRecord.admin, isActive: true },
      { $set: { passwordHash }, $inc: { sessionVersion: 1 } },
    );
    if (!admin)
      return apiBadRequest(
        "This password reset link is invalid or has expired.",
      );

    await PasswordResetToken.updateMany(
      { admin: resetRecord.admin, usedAt: null },
      { $set: { usedAt: new Date() } },
    );
    return apiSuccess("Password reset successful. You can now sign in.");
  } catch (error) {
    if (process.env.NODE_ENV === "development")
      console.error("Password reset failed:", error);
    return apiServerError();
  }
}
