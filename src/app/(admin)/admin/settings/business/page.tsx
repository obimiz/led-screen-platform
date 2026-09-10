import { BusinessSettingsForm } from "@/components/forms/business-settings-form";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getBusinessSettings } from "@/services/business-settings";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const settings = await getBusinessSettings();

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-sm font-bold tracking-widest text-cyan-700 uppercase">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Business profile
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          Manage the company identity and public contact information reused
          across the platform.
        </p>
      </div>
      <BusinessSettingsForm initialValues={settings} />
    </section>
  );
}
