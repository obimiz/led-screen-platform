import type { NextRequest } from "next/server";
import { apiRateLimitError, apiSuccess } from "@/lib/api/responses";
import { checkRateLimit, getRequestIdentifier } from "@/lib/auth/rate-limit";
import { salesApi, salesApiError, salesBody } from "@/lib/sales/api";
import { createRentalRequest, getRentalRequests } from "@/services/rentals";
import { rentalQuerySchema } from "@/lib/validations/rentals";
export async function POST(request: NextRequest) {
  const limit = checkRateLimit(
    `rental-request:${getRequestIdentifier(request)}`,
    5,
    900000,
  );
  if (!limit.allowed) return apiRateLimitError(limit.retryAfter);
  try {
    return apiSuccess(
      "Your rental request has been received.",
      await createRentalRequest(await salesBody(request)),
      201,
    );
  } catch (e) {
    return salesApiError(e);
  }
}
export async function GET(request: NextRequest) {
  return salesApi(async () =>
    apiSuccess(
      "Rental requests loaded",
      await getRentalRequests(
        rentalQuerySchema.parse(
          Object.fromEntries(request.nextUrl.searchParams),
        ),
      ),
    ),
  );
}
