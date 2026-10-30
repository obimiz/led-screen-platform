import { apiNotFound, apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import {
  getSiteAssessmentById,
  updateSiteAssessment,
} from "@/services/installations";
export async function GET(_: Request, c: { params: Promise<{ id: string }> }) {
  return salesApi(async () => {
    const v = await getSiteAssessmentById((await c.params).id);
    return v ? apiSuccess("Loaded", v) : apiNotFound();
  });
}
export async function PUT(r: Request, c: { params: Promise<{ id: string }> }) {
  return salesApi(async (a) =>
    apiSuccess(
      "Updated",
      await updateSiteAssessment((await c.params).id, await salesBody(r), a.id),
    ),
  );
}
