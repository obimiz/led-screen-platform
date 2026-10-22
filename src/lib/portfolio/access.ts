import "server-only";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { salesApi } from "@/lib/sales/api";
import { isSameOriginUpload } from "@/lib/media/upload-origin";
export async function requirePortfolioAdmin() {
  const a = await getCurrentAdmin();
  if (!a) redirect("/admin/login");
  return a;
}
export function portfolioMutation(
  r: Request,
  action: Parameters<typeof salesApi>[0],
) {
  return salesApi(async (admin) => {
    if (!isSameOriginUpload(r))
      return Response.json(
        { success: false, message: "Invalid request origin" },
        { status: 403 },
      );
    return action(admin);
  });
}
