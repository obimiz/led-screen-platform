import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getCurrentAdmin } from "@/lib/auth/current-admin";

export const metadata: Metadata = {
  title: "Admin authentication",
  robots: { index: false, follow: false },
};

export default async function AdminAuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (await getCurrentAdmin()) redirect("/admin");
  return children;
}
