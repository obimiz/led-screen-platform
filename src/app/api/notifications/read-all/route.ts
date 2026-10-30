import { apiSuccess } from "@/lib/api/responses";
import { salesApi } from "@/lib/sales/api";
import { markAllNotificationsRead } from "@/services/notifications";
export async function PATCH() {
  return salesApi(async (admin) =>
    apiSuccess(
      "Notifications marked read",
      await markAllNotificationsRead(admin.id),
    ),
  );
}
