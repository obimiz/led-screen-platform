import { NextResponse, type NextRequest } from "next/server";
import { createOrder, getOrders } from "@/services/orders";
import { salesApi, salesApiError, salesBody } from "@/lib/sales/api";
import { apiSuccess } from "@/lib/api/responses";
import { checkRateLimit, getRequestIdentifier } from "@/lib/auth/rate-limit";
export async function POST(request: NextRequest) {
  const key = getRequestIdentifier(request);
  const limit = checkRateLimit(`orders:${key}`, 10, 60_000);
  if (!limit.allowed)
    return NextResponse.json(
      { success: false, message: "Please try again shortly." },
      { status: 429 },
    );
  try {
    const result = await createOrder(await salesBody(request));
    const response = apiSuccess("Order received", result, 201);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  } catch (e) {
    return salesApiError(e);
  }
}
export async function GET() {
  return salesApi(async () => apiSuccess("Orders loaded", await getOrders()));
}
