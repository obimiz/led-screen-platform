import { apiSuccess, apiNotFound } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { quotationStatusSchema } from "@/lib/validations/sales";
import { updateQuotationStatus } from "@/services/sales";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return salesApi(async (admin) => {
    const input = quotationStatusSchema.parse(await salesBody(request));
    const value = await updateQuotationStatus(
      (await context.params).id,
      input.status,
      input.version,
      admin.id,
    );
    return value
      ? apiSuccess("Quotation status updated", value)
      : apiNotFound();
  });
}
