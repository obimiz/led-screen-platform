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
import { isSameOriginUpload } from "@/lib/media/upload-origin";
import { loginSchema } from "@/lib/validations/auth";
import { Admin } from "@/models/admin";
import type { ApiError, ApiSuccess } from "@/types/api";

const INVALID_CREDENTIALS = "Invalid email or password";

function nativeFormRedirect(error?: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: error ? `/admin/login?error=${error}` : "/admin" },
  });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginUpload(request))
    return NextResponse.json<ApiError>(
      { success: false, message: "Invalid request origin" },
      { status: 403 },
    );
  const nativeForm = request.headers
    .get("content-type")
    ?.startsWith("application/x-www-form-urlencoded");
  const rateLimit = checkRateLimit(
    `login:${getRequestIdentifier(request)}`,
    5,
    15 * 60_000,
  );
  if (!rateLimit.allowed)
    return nativeForm
      ? nativeFormRedirect("rateLimit")
      : apiRateLimitError(rateLimit.retryAfter);

  try {
    const input = nativeForm
      ? Object.fromEntries((await request.formData()).entries())
      : await request.json();
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success)
      return nativeForm
        ? nativeFormRedirect("invalid")
        : apiValidationError(parsed.error);

    await connectToDatabase();
    const admin = await Admin.findOne({ email: parsed.data.email }).select(
      "+passwordHash +sessionVersion",
    );
    if (
      !admin ||
      !admin.isActive ||
      !(await verifyPassword(parsed.data.password, admin.passwordHash))
    ) {
      if (nativeForm) return nativeFormRedirect("invalid");
      return NextResponse.json<ApiError>(
        { success: false, message: INVALID_CREDENTIALS },
        { status: 401 },
      );
    }

    const token = await createSessionToken({
      adminId: admin.id,
      sessionVersion: admin.sessionVersion,
    });
    const response = nativeForm
      ? nativeFormRedirect()
      : NextResponse.json<ApiSuccess<never>>({
          success: true,
          message: "Login successful",
        });
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
    return response;
  } catch (error) {
    if (process.env.NODE_ENV === "development")
      console.error("Login failed:", error);
    return nativeForm ? nativeFormRedirect("unavailable") : apiServerError();
  }
}
