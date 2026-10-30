import { apiSuccess } from "@/lib/api/responses";
import { salesApi } from "@/lib/sales/api";
import { getMaintenanceJobs } from "@/services/maintenance";
export async function GET() {
  return salesApi(async () =>
    apiSuccess("Maintenance jobs loaded", await getMaintenanceJobs()),
  );
}
