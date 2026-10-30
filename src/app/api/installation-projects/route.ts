import { apiSuccess } from "@/lib/api/responses";
import { salesApi } from "@/lib/sales/api";
import { getInstallationProjects } from "@/services/installations";
export async function GET() {
  return salesApi(async () =>
    apiSuccess("Projects loaded", await getInstallationProjects()),
  );
}
export async function POST() {
  return salesApi(async () =>
    apiSuccess("Use quotation conversion to create projects", null, 400),
  );
}
