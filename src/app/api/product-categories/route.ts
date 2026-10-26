import { productTypes } from "@/lib/constants/products";
import { NextResponse, type NextRequest } from "next/server";
import {
  apiServerError,
  apiSuccess,
  apiValidationError,
} from "@/lib/api/responses";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { isSameOriginUpload } from "@/lib/media/upload-origin";
import { productCategorySchema } from "@/lib/validations/product";
import {
  createProductCategory,
  getCategoriesByType,
  updateProductCategory,
} from "@/services/products";
import type { ApiError } from "@/types/api";

function nativeCategoryRedirect(
  productType: string,
  outcome: "saved" | "invalid" | "failed",
) {
  const path =
    productType === "led-accessory"
      ? "/admin/accessory-categories"
      : `/admin/product-categories?productType=${encodeURIComponent(productType)}`;
  const separator = path.includes("?") ? "&" : "?";
  const suffix = outcome === "saved" ? "saved=1" : `error=${outcome}`;
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `${path}${separator}${suffix}` },
  });
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    const productType =
      productTypes.find(
        (type) => type === request.nextUrl.searchParams.get("productType"),
      ) || "led-screen";
    return apiSuccess(
      "Categories loaded",
      await getCategoriesByType(productType, Boolean(admin)),
    );
  } catch {
    return apiServerError();
  }
}
export async function POST(request: NextRequest) {
  const nativeForm = request.headers
    .get("content-type")
    ?.startsWith("application/x-www-form-urlencoded");
  const admin = await getCurrentAdmin();
  if (!admin)
    return nativeForm
      ? new NextResponse(null, {
          status: 303,
          headers: { Location: "/admin/login" },
        })
      : NextResponse.json<ApiError>(
          { success: false, message: "Authentication required." },
          { status: 401 },
        );
  if (!isSameOriginUpload(request))
    return NextResponse.json<ApiError>(
      { success: false, message: "Invalid request origin" },
      { status: 403 },
    );
  let returnType = "led-screen";
  try {
    const form = nativeForm ? await request.formData() : null;
    const input = form
      ? {
          name: form.get("name"),
          description: form.get("description"),
          imageUrl: form.get("imageUrl"),
          active: form.has("active"),
          sortOrder: form.get("sortOrder") || "0",
          productType: form.get("productType"),
        }
      : await request.json();
    if (form && typeof form.get("productType") === "string")
      returnType = String(form.get("productType"));
    const parsed = productCategorySchema.safeParse(input);
    if (!parsed.success)
      return nativeForm
        ? nativeCategoryRedirect(returnType, "invalid")
        : apiValidationError(parsed.error);
    const categoryId = form?.get("categoryId");
    const category = categoryId
      ? await updateProductCategory(String(categoryId), parsed.data)
      : await createProductCategory(parsed.data);
    if (!category)
      return nativeForm
        ? nativeCategoryRedirect(parsed.data.productType, "failed")
        : NextResponse.json<ApiError>(
            { success: false, message: "Category not found." },
            { status: 404 },
          );
    if (nativeForm)
      return nativeCategoryRedirect(parsed.data.productType, "saved");
    return apiSuccess(
      categoryId ? "Category updated" : "Category created",
      category,
      categoryId ? 200 : 201,
    );
  } catch {
    return nativeForm
      ? nativeCategoryRedirect(returnType, "failed")
      : apiServerError();
  }
}
