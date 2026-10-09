import { redirect } from "next/navigation";

import { getCurrentAdmin } from "@/lib/auth/current-admin";

export default async function AdminFoundationPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <section className="mx-auto max-w-5xl">
      <p className="text-sm font-bold tracking-widest text-brand-700 uppercase">
        Secure admin area
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-brand-900">
        Welcome, {admin.name}
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-600">
        You are signed in as {admin.email} with the {admin.role} role. Business
        dashboard modules have not been implemented yet.
      </p>
    </section>
  );
}
