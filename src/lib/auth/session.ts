import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "led_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  adminId: string;
  sessionVersion: number;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be configured with at least 32 characters.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ sessionVersion: payload.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.adminId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub || typeof payload.sessionVersion !== "number") return null;
    return { adminId: payload.sub, sessionVersion: payload.sessionVersion };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
  priority: "high" as const,
};

export async function readSessionToken() {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value;
}
