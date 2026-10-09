import { apiNotFound, apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { getRentalBookingById, updateRentalBooking } from "@/services/rentals";
type C = { params: Promise<{ id: string }> };
export async function GET(_r: Request, c: C) {
  return salesApi(async () => {
    const v = await getRentalBookingById((await c.params).id);
    return v ? apiSuccess("Rental booking loaded", v) : apiNotFound();
  });
}
export async function PUT(r: Request, c: C) {
  return salesApi(async (a) => {
    const v = await updateRentalBooking(
      (await c.params).id,
      await salesBody(r),
      a.id,
    );
    return v ? apiSuccess("Rental booking updated", v) : apiNotFound();
  });
}
