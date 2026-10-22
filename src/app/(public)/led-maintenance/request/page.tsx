import { PageHero } from "@/components/layout/page-hero";
import { MaintenanceRequestForm } from "@/components/maintenance/maintenance-request-form";
import { getPublicBusinessSettings } from "@/services/business-settings";
export const dynamic = "force-dynamic";
export default async function Page() {
  const b = await getPublicBusinessSettings();
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHero
        title={<>Request LED maintenance or repair</>}
        description={
          <>
            {" "}
            Choose the closest description. Our technician will diagnose the
            actual fault.{" "}
          </>
        }
      />
      <MaintenanceRequestForm whatsappNumber={b.whatsappNumber} />
    </main>
  );
}
