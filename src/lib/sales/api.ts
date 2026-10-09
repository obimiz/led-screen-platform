import "server-only";
import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import {
  apiBadRequest,
  apiServerError,
  apiValidationError,
} from "@/lib/api/responses";
import { SalesError } from "./calculations";
import type { SafeAdmin } from "@/types/auth";
export async function salesApi(
  action: (admin: SafeAdmin) => Promise<Response>,
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin)
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      );
    const response = await action(admin);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  } catch (error) {
    return salesApiError(error);
  }
}
export function salesApiError(error: unknown) {
  if (error instanceof ZodError) return apiValidationError(error);
  if (error instanceof SalesError)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.status },
    );
  if (error instanceof SyntaxError)
    return apiBadRequest("Send a valid JSON request.");
  if (error instanceof Error && error.name === "VersionError")
    return NextResponse.json(
      { success: false, message: "This record changed. Reload before saving." },
      { status: 409 },
    );
  return apiServerError();
}
export async function salesBody(request: Request): Promise<unknown> {
  const body = await request.text();
  if (body.length > 150000) throw new SalesError("Request is too large.", 413);
  return JSON.parse(body);
}
