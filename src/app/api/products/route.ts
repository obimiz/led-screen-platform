import { NextResponse, type NextRequest } from "next/server";
import {
  apiBadRequest,
  apiServerError,
  apiSuccess,
  apiValidationError,
} from "@/lib/api/responses";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import {
  accessorySchema,
  productQuerySchema,
  productSchema,
} from "@/lib/validations/product";
import {
  createAccessory,
  createLedProduct,
  getAccessories,
  getLedProducts,
} from "@/services/products";
import type { ApiError } from "@/types/api";

export async function GET(request: NextRequest) {
  try {
    const parsed = productQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!parsed.success) return apiValidationError(parsed.error);
    const admin = await getCurrentAdmin();
    const result =
      parsed.data.productType === "led-accessory"
        ? await getAccessories(parsed.data, Boolean(admin))
        : await getLedProducts(parsed.data, Boolean(admin));
    return apiSuccess("Products loaded", result);
  } catch (error) {
    if (process.env.NODE_ENV === "development")
      console.error("Product list failed:", error);
    return apiServerError();
  }
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin)
    return NextResponse.json<ApiError>(
      { success: false, message: "Authentication required." },
      { status: 401 },
    );
  try {
    const body: unknown = await request.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "productType" in body &&
      body.productType === "led-accessory"
    ) {
      const parsed = accessorySchema.safeParse(body);
      if (!parsed.success) return apiValidationError(parsed.error);
      return apiSuccess(
        "Accessory created",
        await createAccessory(parsed.data, admin.id),
        201,
      );
    }
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);
    return apiSuccess(
      "LED product created",
      await createLedProduct(parsed.data, admin.id),
      201,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CATEGORY")
      return apiBadRequest("Select a valid product category.");
    if (error instanceof Error && error.message.includes("E11000"))
      return apiBadRequest("That SKU is already in use.");
    if (process.env.NODE_ENV === "development")
      console.error("Product creation failed:", error);
    return apiServerError();
  }
}
