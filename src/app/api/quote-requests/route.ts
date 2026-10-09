import type { NextRequest } from "next/server";
import { apiSuccess, apiRateLimitError } from "@/lib/api/responses";
import { checkRateLimit, getRequestIdentifier } from "@/lib/auth/rate-limit";
import { salesApi, salesApiError, salesBody } from "@/lib/sales/api";
import { salesQuerySchema } from "@/lib/validations/sales";
import { createQuoteRequest, getQuoteRequests } from "@/services/sales";
export async function POST(request: NextRequest) {
  const limit = checkRateLimit(
    `quote-request:${getRequestIdentifier(request)}`,
    5,
    15 * 60 * 1000,
  );
  if (!limit.allowed) return apiRateLimitError(limit.retryAfter);
  try {
    return apiSuccess(
      "Your quotation request has been received.",
      await createQuoteRequest(await salesBody(request)),
      201,
    );
  } catch (error) {
    return salesApiError(error);
  }
}
export async function GET(request: NextRequest) {
  return salesApi(async () =>
    apiSuccess(
      "Enquiries loaded",
      await getQuoteRequests(
        salesQuerySchema.parse(
          Object.fromEntries(request.nextUrl.searchParams),
        ),
      ),
    ),
  );
}
