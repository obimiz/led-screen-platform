import { apiSuccess, apiNotFound } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { updateQuoteRequestSchema } from "@/lib/validations/sales";
import { getQuoteRequestById, updateQuoteRequest } from "@/services/sales";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  return salesApi(async () => {
    const value = await getQuoteRequestById((await context.params).id);
    return value ? apiSuccess("Enquiry loaded", value) : apiNotFound();
  });
}
export async function PUT(request: Request, context: Context) {
  return salesApi(async (admin) => {
    const value = await updateQuoteRequest(
      (await context.params).id,
      updateQuoteRequestSchema.parse(await salesBody(request)),
      admin.id,
    );
    return value ? apiSuccess("Enquiry updated", value) : apiNotFound();
  });
}
