import { apiNotFound, apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import {
  getBellAlarmRequestById,
  updateBellAlarmRequest,
} from "@/services/bell-alarm-requests";
export async function GET(_: Request, c: { params: Promise<{ id: string }> }) {
  return salesApi(async () => {
    const d = await getBellAlarmRequestById((await c.params).id);
    return d ? apiSuccess("Loaded", d) : apiNotFound();
  });
}
export async function PUT(r: Request, c: { params: Promise<{ id: string }> }) {
  return salesApi(async (a) =>
    apiSuccess(
      "Updated",
      await updateBellAlarmRequest(
        (await c.params).id,
        await salesBody(r),
        a.id,
      ),
    ),
  );
}
