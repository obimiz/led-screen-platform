import { NextResponse, type NextRequest } from "next/server";

import {
  apiRateLimitError,
  apiServerError,
  apiValidationError,
} from "@/lib/api/responses";
import { verifyPassword } from "@/lib/auth/password";
import { checkRateLimit, getRequestIdentifier } from "@/lib/auth/rate-limit";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { loginSchema } from "@/lib/validations/auth";
import { Admin } from "@/models/admin";
import type { ApiError, ApiSuccess } from "@/types/api";

const INVALID_CREDENTIALS = "Invalid email or password";

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(
    `login:${getRequestIdentifier(request)}`,
    5,
    15 * 60_000,
  );
  if (!rateLimit.allowed) return apiRateLimitError(rateLimit.retryAfter);

  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    await connectToDatabase();
    const admin = await Admin.findOne({ email: parsed.data.email }).select(
      "+passwordHash +sessionVersion",
    );
    if (
      !admin ||
      !admin.isActive ||
      !(await verifyPassword(parsed.data.password, admin.passwordHash))
    ) {
      return NextResponse.json<ApiError>(
        { success: false, message: INVALID_CREDENTIALS },
        { status: 401 },
      );
    }

    const token = await createSessionToken({
      adminId: admin.id,
      sessionVersion: admin.sessionVersion,
    });
    const response = NextResponse.json<ApiSuccess<never>>({
      success: true,
      message: "Login successful",
    });
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
    return response;
  } catch (error) {
    if (process.env.NODE_ENV === "development")
      console.error("Login failed:", error);
    return apiServerError();
  }
}
