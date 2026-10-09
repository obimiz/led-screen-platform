import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/responses";
import { salesApi } from "@/lib/sales/api";
import { checkRentalAvailability } from "@/services/rentals";
export async function GET(r: NextRequest) {
  return salesApi(async () =>
    apiSuccess(
      "Availability loaded",
      await checkRentalAvailability(
        r.nextUrl.searchParams.get("productId") ?? "",
        Number(r.nextUrl.searchParams.get("quantity") ?? 1),
        r.nextUrl.searchParams.get("start") ?? "",
        r.nextUrl.searchParams.get("end") ?? "",
      ),
    ),
  );
}
