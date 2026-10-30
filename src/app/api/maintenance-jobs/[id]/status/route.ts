import { apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { maintenanceStatusSchema } from "@/lib/validations/maintenance";
import { updateMaintenanceJobStatus } from "@/services/maintenance";
export async function PATCH(
  r: Request,
  c: { params: Promise<{ id: string }> },
) {
  return salesApi(async (a) => {
    const b = maintenanceStatusSchema.parse(await salesBody(r));
    return apiSuccess(
      "Status updated",
      await updateMaintenanceJobStatus(
        (await c.params).id,
        b.status,
        b.version,
        a.id,
      ),
    );
  });
}
