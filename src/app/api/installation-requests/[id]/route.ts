import { apiNotFound, apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import {
  getInstallationRequestById,
  updateInstallationRequest,
} from "@/services/installations";
export async function GET(_: Request, c: { params: Promise<{ id: string }> }) {
  return salesApi(async () => {
    const v = await getInstallationRequestById((await c.params).id);
    return v ? apiSuccess("Loaded", v) : apiNotFound();
  });
}
export async function PUT(r: Request, c: { params: Promise<{ id: string }> }) {
  return salesApi(async () => {
    const v = await updateInstallationRequest(
      (await c.params).id,
      await salesBody(r),
    );
    return v ? apiSuccess("Updated", v) : apiNotFound();
  });
}
