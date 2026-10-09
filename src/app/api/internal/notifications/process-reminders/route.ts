import crypto from "node:crypto";
import { NextResponse } from "next/server";

function validSecret(value: string | undefined): value is string {
  return Boolean(value && value.length >= 32);
}

function validAuthorization(header: string | null, secret: string) {
  const prefix = "Bearer ";
  if (!header?.startsWith(prefix)) return false;
  const supplied = header.slice(prefix.length);
  const expected = Buffer.from(secret, "utf8");
  const actual = Buffer.from(supplied, "utf8");
  return (
    actual.length === expected.length &&
    crypto.timingSafeEqual(actual, expected)
  );
}

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (
    !validSecret(secret) ||
    !validAuthorization(req.headers.get("authorization"), secret)
  )
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  return NextResponse.json(
    { success: true, message: "Reminder processing completed.", processed: 0 },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
