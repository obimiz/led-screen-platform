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
        <p className="text-brand-700 text-sm font-bold tracking-widest uppercase">
          Settings
        </p>
        <h1 className="text-brand-900 mt-2 text-3xl font-black tracking-tight">
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
