import "server-only";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
// Check every sales page before reading private records. A parent layout alone
// is insufficient because App Router renders and navigates segments separately.
export async function requireSalesAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
