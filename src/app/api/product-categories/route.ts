import { NextResponse, type NextRequest } from "next/server";
import {
  apiServerError,
  apiSuccess,
  apiValidationError,
} from "@/lib/api/responses";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { productCategorySchema } from "@/lib/validations/product";
import {
  createProductCategory,
  getCategoriesByType,
} from "@/services/products";
import type { ApiError } from "@/types/api";

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    const productType =
      request.nextUrl.searchParams.get("productType") === "led-accessory"
        ? "led-accessory"
        : "led-screen";
    return apiSuccess(
      "Categories loaded",
      await getCategoriesByType(productType, Boolean(admin)),
    );
  } catch {
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
    const parsed = productCategorySchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);
    return apiSuccess(
      "Category created",
      await createProductCategory(parsed.data),
      201,
    );
  } catch {
    return apiServerError();
  }
}
