import "server-only";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { salesApi } from "@/lib/sales/api";
import { isSameOriginUpload } from "@/lib/media/upload-origin";
import { SalesError } from "@/lib/sales/calculations";
import { ZodError } from "zod";
export async function requireMusicAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
export function musicMutation(
  request: Request,
  action: Parameters<typeof salesApi>[0],
) {
  return salesApi(async (admin) => {
    if (!isSameOriginUpload(request))
      return Response.json(
        { success: false, message: "Invalid request origin" },
        { status: 403 },
      );
    try {
      return await action(admin);
    } catch (error) {
      if (
        error instanceof Error &&
        !(error instanceof SalesError) &&
        !(error instanceof ZodError)
      )
        console.error("Music mutation failed:", error.stack);
      throw error;
    }
  });
}
