import { NextRequest } from "next/server";
import { apiSuccess, apiRateLimitError } from "@/lib/api/responses";
import { checkRateLimit, getRequestIdentifier } from "@/lib/auth/rate-limit";
import {
  createContactEnquiry,
  getContactEnquiries,
} from "@/services/contact-enquiries";
import { salesApi, salesApiError, salesBody } from "@/lib/sales/api";
export async function POST(req: NextRequest) {
  const l = checkRateLimit(
    `contact:${getRequestIdentifier(req)}`,
    5,
    15 * 60 * 1000,
  );
  if (!l.allowed) return apiRateLimitError(l.retryAfter);
  try {
    return apiSuccess(
      "Enquiry received",
      await createContactEnquiry(await salesBody(req)),
      201,
    );
  } catch (e) {
    return salesApiError(e);
  }
}
export async function GET() {
  return salesApi(async () =>
    apiSuccess("Enquiries loaded", await getContactEnquiries()),
  );
}
