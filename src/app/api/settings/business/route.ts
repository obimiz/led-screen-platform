import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import {
  apiServerError,
  apiSuccess,
  apiValidationError,
} from "@/lib/api/responses";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { businessSettingsSchema } from "@/lib/validations/business-settings";
import {
  getBusinessSettings,
  updateBusinessSettings,
} from "@/services/business-settings";
import type { ApiError } from "@/types/api";
import { NextResponse } from "next/server";

function unauthorized() {
  return NextResponse.json<ApiError>(
    { success: false, message: "Authentication required." },
    { status: 401 },
  );
}

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();

  try {
    return apiSuccess("Business settings loaded", await getBusinessSettings());
  } catch (error) {
    if (process.env.NODE_ENV === "development")
      console.error("Business settings load failed:", error);
    return apiServerError();
  }
}

export async function PUT(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();

  try {
    const parsed = businessSettingsSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);
    const settings = await updateBusinessSettings(parsed.data, admin.id);
    revalidatePath("/", "layout");
    return apiSuccess("Business settings saved successfully", settings);
  } catch (error) {
    if (process.env.NODE_ENV === "development")
      console.error("Business settings update failed:", error);
    return apiServerError();
  }
}
