import { notFound } from "next/navigation";
import { requireMaintenanceAdmin } from "@/lib/maintenance/access";
import { getMaintenanceJobById } from "@/services/maintenance";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMaintenanceAdmin();
  const x = await getMaintenanceJobById((await params).id);
  if (!x) return notFound();
  return (
    <main className="max-w-5xl p-6">
      <p className="text-sm text-slate-500">{x.jobNumber}</p>
      <h1 className="mt-2 text-3xl font-black">Maintenance job</h1>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <section className="rounded-xl border p-5">
          <h2 className="font-bold">Customer and equipment</h2>
          <p className="mt-2">
            {x.customerSnapshot?.name}
            <br />
            {x.equipmentSnapshot?.name}
            <br />
            {x.locationSnapshot?.venueName}
          </p>
        </section>
        <section className="rounded-xl border p-5">
          <h2 className="font-bold">Diagnosis</h2>
          <p className="mt-2 whitespace-pre-wrap">
            {x.diagnosis || "Not recorded"}
          </p>
          <p className="mt-3">
            Status: {x.status} · Warranty: {x.warrantyStatus}
          </p>
        </section>
        <section className="rounded-xl border p-5 md:col-span-2">
          <h2 className="font-bold">Repair and testing</h2>
          <p className="mt-2">
            Parts: {x.partsUsed?.length || 0} · Actions:{" "}
            {x.repairActions?.length || 0} · Tests:{" "}
            {x.testsPerformed?.length || 0}
          </p>
          <p className="mt-3 whitespace-pre-wrap">
            {x.completionSummary || x.recommendations || ""}
          </p>
        </section>
      </div>
    </main>
  );
}
