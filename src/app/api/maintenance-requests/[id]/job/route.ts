import { apiSuccess } from "@/lib/api/responses";
import { salesApi } from "@/lib/sales/api";
import { createMaintenanceJob } from "@/services/maintenance";
export async function POST(_: Request, c: { params: Promise<{ id: string }> }) {
  return salesApi(async (a) =>
    apiSuccess(
      "Maintenance job created",
      await createMaintenanceJob((await c.params).id, a.id),
      201,
    ),
  );
}
