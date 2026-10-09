import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { getRentalBookings, createRentalBooking } from "@/services/rentals";
import { rentalQuerySchema } from "@/lib/validations/rentals";
export async function GET(r: NextRequest) {
  return salesApi(async () =>
    apiSuccess(
      "Rental bookings loaded",
      await getRentalBookings(
        rentalQuerySchema.parse(Object.fromEntries(r.nextUrl.searchParams)),
      ),
    ),
  );
}
export async function POST(r: Request) {
  return salesApi(async (a) =>
    apiSuccess(
      "Rental booking created",
      await createRentalBooking(await salesBody(r), a.id),
      201,
    ),
  );
}
