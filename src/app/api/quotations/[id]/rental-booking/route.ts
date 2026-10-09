import { apiNotFound, apiSuccess } from "@/lib/api/responses";
import { salesApi } from "@/lib/sales/api";
import { createRentalBookingFromQuotation } from "@/services/rentals";
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return salesApi(async (admin) => {
    const value = await createRentalBookingFromQuotation(
      (await context.params).id,
      admin.id,
    );
    return value
      ? apiSuccess("Rental booking created", value, 201)
      : apiNotFound();
  });
}
