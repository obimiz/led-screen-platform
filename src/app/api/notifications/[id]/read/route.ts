import { apiSuccess, apiNotFound } from "@/lib/api/responses";
import { salesApi } from "@/lib/sales/api";
import { markNotificationRead } from "@/services/notifications";
export async function PATCH(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return salesApi(async (admin) => {
    const n = await markNotificationRead((await params).id, admin.id, true);
    return n ? apiSuccess("Notification marked read", n) : apiNotFound();
  });
}
