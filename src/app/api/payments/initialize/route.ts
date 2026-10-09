import { NextResponse, type NextRequest } from "next/server";
import { initializeOrderPayment } from "@/services/payments";
import { initializePaymentSchema } from "@/lib/validations/payments";
import { checkRateLimit, getRequestIdentifier } from "@/lib/auth/rate-limit";
import { salesApiError, salesBody } from "@/lib/sales/api";
export async function POST(request: NextRequest) {
  const l = checkRateLimit(
    `payment-init:${getRequestIdentifier(request)}`,
    8,
    60_000,
  );
  if (!l.allowed)
    return NextResponse.json(
      { success: false, message: "Please try again shortly." },
      { status: 429 },
    );
  try {
    const input = initializePaymentSchema.parse(await salesBody(request));
    return NextResponse.json(
      {
        success: true,
        data: await initializeOrderPayment(input.orderPublicToken),
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (e) {
    return salesApiError(e);
  }
}
