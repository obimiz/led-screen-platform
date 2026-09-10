import { type NextRequest } from "next/server";

import {
  apiRateLimitError,
  apiServerError,
  apiSuccess,
  apiValidationError,
} from "@/lib/api/responses";
import { checkRateLimit, getRequestIdentifier } from "@/lib/auth/rate-limit";
import { createPasswordResetToken } from "@/lib/auth/reset-token";
import { connectToDatabase } from "@/lib/db/mongoose";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { siteConfig } from "@/lib/config/site";
import { Admin } from "@/models/admin";
import { PasswordResetToken } from "@/models/password-reset-token";

const GENERIC_MESSAGE =
  "If an account exists for this email, password reset instructions have been generated.";

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(
    `forgot:${getRequestIdentifier(request)}`,
    3,
    15 * 60_000,
  );
  if (!rateLimit.allowed) return apiRateLimitError(rateLimit.retryAfter);

  try {
    const parsed = forgotPasswordSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    await connectToDatabase();
    const admin = await Admin.findOne({
      email: parsed.data.email,
      isActive: true,
    })
      .select("_id")
      .lean();
    let resetUrl: string | undefined;

    if (admin) {
      await PasswordResetToken.deleteMany({ admin: admin._id, usedAt: null });
      const reset = createPasswordResetToken();
      await PasswordResetToken.create({
        admin: admin._id,
        tokenHash: reset.tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60_000),
      });
      resetUrl = `${siteConfig.url}/admin/reset-password/${reset.token}`;
      if (process.env.NODE_ENV === "development")
        console.info(`[development only] Password reset URL: ${resetUrl}`);
    }

    return apiSuccess(
      GENERIC_MESSAGE,
      process.env.NODE_ENV === "development" && resetUrl
        ? { resetUrl }
        : undefined,
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development")
      console.error("Forgot-password request failed:", error);
    return apiServerError();
  }
}
