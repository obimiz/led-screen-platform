import { NextResponse, type NextRequest } from "next/server";
import {
  apiBadRequest,
  apiNotFound,
  apiServerError,
  apiSuccess,
  apiValidationError,
} from "@/lib/api/responses";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { accessorySchema, productSchema } from "@/lib/validations/product";
import {
  archiveLedProduct,
  getAccessoryById,
  getLedProductById,
  setAccessoryArchived,
  updateAccessory,
  updateLedProduct,
} from "@/services/products";
import type { ApiError } from "@/types/api";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const accessory =
      request.nextUrl.searchParams.get("productType") === "led-accessory";
    const product = accessory
      ? await getAccessoryById((await params).id)
      : await getLedProductById((await params).id);
    const admin = await getCurrentAdmin();
    if (!product || (!admin && product.status !== "published"))
      return apiNotFound("Product not found.");
    return apiSuccess("Product loaded", product);
  } catch {
    return apiServerError();
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
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
      const product = await updateAccessory(
        (await params).id,
        parsed.data,
        admin.id,
      );
      return product
        ? apiSuccess("Accessory updated", product)
        : apiNotFound("Accessory not found.");
    }
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);
    const product = await updateLedProduct(
      (await params).id,
      parsed.data,
      admin.id,
    );
    return product
      ? apiSuccess("LED product updated", product)
      : apiNotFound("LED product not found.");
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CATEGORY")
      return apiBadRequest("Select a valid product category.");
    if (error instanceof Error && error.message.includes("E11000"))
      return apiBadRequest("That SKU is already in use.");
    return apiServerError();
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const admin = await getCurrentAdmin();
  if (!admin)
    return NextResponse.json<ApiError>(
      { success: false, message: "Authentication required." },
      { status: 401 },
    );
  try {
    const body: unknown = await request.json().catch(() => ({}));
    const accessory =
      typeof body === "object" &&
      body !== null &&
      "productType" in body &&
      body.productType === "led-accessory";
    const restore =
      typeof body === "object" &&
      body !== null &&
      "action" in body &&
      body.action === "restore";
    const product = accessory
      ? await setAccessoryArchived((await params).id, admin.id, !restore)
      : await archiveLedProduct((await params).id, admin.id);
    return product
      ? apiSuccess(
          restore ? "Accessory restored to draft" : "Product archived",
          product,
        )
      : apiNotFound("Product not found.");
  } catch {
    return apiServerError();
  }
}
