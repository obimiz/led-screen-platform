import type { NextRequest } from "next/server";
import { apiRateLimitError, apiSuccess } from "@/lib/api/responses";
import { checkRateLimit, getRequestIdentifier } from "@/lib/auth/rate-limit";
import { salesApi, salesApiError, salesBody } from "@/lib/sales/api";
import {
  createBellAlarmRequest,
  getBellAlarmRequests,
} from "@/services/bell-alarm-requests";
export async function POST(r: NextRequest) {
  const l = checkRateLimit(`bell-alarm:${getRequestIdentifier(r)}`, 5, 900000);
  if (!l.allowed) return apiRateLimitError(l.retryAfter);
  try {
    return apiSuccess(
      "Bell/alarm request received",
      await createBellAlarmRequest(await salesBody(r)),
      201,
    );
  } catch (e) {
    return salesApiError(e);
  }
}
export async function GET() {
  return salesApi(async () =>
    apiSuccess("Requests loaded", await getBellAlarmRequests()),
  );
}
