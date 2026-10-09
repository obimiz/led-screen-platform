import { NextResponse } from "next/server";
import { verifyPaystackSignature } from "@/lib/payments/paystack";
import { verifyPayment } from "@/services/payments";
export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 1_000_000)
    return NextResponse.json(
      { success: false, message: "Payload too large." },
      { status: 413 },
    );
  const body = await request.text();
  if (body.length > 1_000_000)
    return NextResponse.json(
      { success: false, message: "Payload too large." },
      { status: 413 },
    );
  if (
    !verifyPaystackSignature(
      body,
      request.headers.get("x-paystack-signature") || "",
    )
  )
    return NextResponse.json(
      { success: false, message: "Invalid signature." },
      { status: 401 },
    );
  try {
    const payload = JSON.parse(body);
    if (payload.event === "charge.success" && payload.data?.reference)
      await verifyPayment(String(payload.data.reference));
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
