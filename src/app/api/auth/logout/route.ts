import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import type { ApiSuccess } from "@/types/api";

export function POST() {
  const response = NextResponse.json<ApiSuccess<never>>({
    success: true,
    message: "Logout successful",
  });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  });
  return response;
}
