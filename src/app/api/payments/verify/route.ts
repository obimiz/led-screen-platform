import { NextResponse, type NextRequest } from "next/server";
import { verifyPayment } from "@/services/payments";
import { verifyPaymentSchema } from "@/lib/validations/payments";
import { checkRateLimit, getRequestIdentifier } from "@/lib/auth/rate-limit";
import { salesApiError, salesBody } from "@/lib/sales/api";
export async function POST(request: NextRequest) {
  const l = checkRateLimit(
    `payment-verify:${getRequestIdentifier(request)}`,
    15,
    60_000,
  );
  if (!l.allowed)
    return NextResponse.json(
      { success: false, message: "Please try again shortly." },
      { status: 429 },
    );
  try {
    const input = verifyPaymentSchema.parse(await salesBody(request));
    return NextResponse.json(
      { success: true, data: await verifyPayment(input.reference) },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (e) {
    return salesApiError(e);
  }
}
