import { apiNotFound, apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { getRentalRequestById, updateRentalRequest } from "@/services/rentals";
type C = { params: Promise<{ id: string }> };
export async function GET(_r: Request, c: C) {
  return salesApi(async () => {
    const v = await getRentalRequestById((await c.params).id);
    return v ? apiSuccess("Rental request loaded", v) : apiNotFound();
  });
}
export async function PUT(r: Request, c: C) {
  return salesApi(async (a) => {
    const v = await updateRentalRequest(
      (await c.params).id,
      await salesBody(r),
      a.id,
    );
    return v ? apiSuccess("Rental request updated", v) : apiNotFound();
  });
}
