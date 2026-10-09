import { apiNotFound, apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { updateRentalBookingStatus } from "@/services/rentals";
export async function PATCH(
  r: Request,
  c: { params: Promise<{ id: string }> },
) {
  return salesApi(async (a) => {
    const v = await updateRentalBookingStatus(
      (await c.params).id,
      await salesBody(r),
      a.id,
    );
    return v ? apiSuccess("Rental booking updated", v) : apiNotFound();
  });
}
