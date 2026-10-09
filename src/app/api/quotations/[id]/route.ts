import { apiSuccess, apiNotFound } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { getQuotationById, updateQuotation } from "@/services/sales";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  return salesApi(async () => {
    const value = await getQuotationById((await context.params).id);
    return value ? apiSuccess("Quotation loaded", value) : apiNotFound();
  });
}
export async function PUT(request: Request, context: Context) {
  return salesApi(async (admin) => {
    const value = await updateQuotation(
      (await context.params).id,
      await salesBody(request),
      admin.id,
    );
    return value ? apiSuccess("Quotation saved", value) : apiNotFound();
  });
}
