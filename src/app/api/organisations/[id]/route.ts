import { apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { deleteOrganisation, saveOrganisation } from "@/services/organisations";
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  return salesApi(async () =>
    apiSuccess(
      "Organisation updated",
      await saveOrganisation(
        await salesBody(request),
        (await context.params).id,
      ),
    ),
  );
}
export async function DELETE(_request: Request, context: Context) {
  return salesApi(async () => {
    await deleteOrganisation((await context.params).id);
    return apiSuccess("Organisation deleted");
  });
}
