import { NextResponse } from "next/server";
import type { ZodError } from "zod";

import type { ApiError, ApiSuccess } from "@/types/api";

export function apiSuccess<T>(message: string, data?: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>(
    { success: true, message, ...(data === undefined ? {} : { data }) },
    { status },
  );
}

export function apiValidationError(error: ZodError) {
  const fields = error.flatten().fieldErrors;

  return NextResponse.json<ApiError>(
    {
      success: false,
      message: "Please check the submitted data.",
      errors: fields,
    },
    { status: 422 },
  );
}

export function apiNotFound(message = "The requested resource was not found.") {
  return NextResponse.json<ApiError>(
    { success: false, message },
    { status: 404 },
  );
}

export function apiBadRequest(message: string) {
  return NextResponse.json<ApiError>(
    { success: false, message },
    { status: 400 },
  );
}

export function apiServerError() {
  return NextResponse.json<ApiError>(
    {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    },
    { status: 500 },
  );
}

export function apiRateLimitError(retryAfter: number) {
  return NextResponse.json<ApiError>(
    { success: false, message: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
