import "server-only";

import { cache } from "react";

import { connectToDatabase } from "@/lib/db/mongoose";
import { Admin } from "@/models/admin";
import type { SafeAdmin } from "@/types/auth";
import { readSessionToken, verifySessionToken } from "./session";

export const getCurrentAdmin = cache(async (): Promise<SafeAdmin | null> => {
  const token = await readSessionToken();
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  await connectToDatabase();
  const admin = await Admin.findById(session.adminId)
    .select("+sessionVersion")
    .lean();
  if (
    !admin ||
    !admin.isActive ||
    admin.sessionVersion !== session.sessionVersion
  )
    return null;

  return {
    id: admin._id.toString(),
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
});
