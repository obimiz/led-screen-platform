import { apiNotFound, apiSuccess } from "@/lib/api/responses";
import { salesApi } from "@/lib/sales/api";
import { createRentalQuotationFromRequest } from "@/services/rentals";
export async function POST(
  _r: Request,
  c: { params: Promise<{ id: string }> },
) {
  return salesApi(async (a) => {
    const id = await createRentalQuotationFromRequest(
      (await c.params).id,
      a.id,
    );
    return id ? apiSuccess("Rental quotation created", { id }) : apiNotFound();
  });
}
