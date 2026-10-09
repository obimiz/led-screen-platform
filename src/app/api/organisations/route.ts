import { apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { getOrganisations, saveOrganisation } from "@/services/organisations";
export async function GET() {
  return salesApi(async () =>
    apiSuccess("Organisations loaded", await getOrganisations()),
  );
}
export async function POST(request: Request) {
  return salesApi(async () =>
    apiSuccess(
      "Organisation created",
      await saveOrganisation(await salesBody(request)),
      201,
    ),
  );
}
