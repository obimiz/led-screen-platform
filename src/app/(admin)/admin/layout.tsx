import { getRobotsMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { getCurrentAdmin } from "@/lib/auth/current-admin";

export const metadata: Metadata = {
  title: "Administration",
  robots: getRobotsMetadata({ index: false, follow: false }),
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="admin-shell flex min-h-dvh bg-white">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar admin={admin} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
