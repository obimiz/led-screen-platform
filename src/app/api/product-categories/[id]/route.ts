import { NextResponse, type NextRequest } from "next/server";
import {
  apiNotFound,
  apiServerError,
  apiSuccess,
  apiValidationError,
} from "@/lib/api/responses";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { productCategorySchema } from "@/lib/validations/product";
import { updateProductCategory } from "@/services/products";
import type { ApiError } from "@/types/api";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin)
    return NextResponse.json<ApiError>(
      { success: false, message: "Authentication required." },
      { status: 401 },
    );
  try {
    const parsed = productCategorySchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);
    const category = await updateProductCategory(
      (await params).id,
      parsed.data,
    );
    if (!category) return apiNotFound("Category not found.");
    return apiSuccess("Category updated", category);
  } catch {
    return apiServerError();
  }
}
