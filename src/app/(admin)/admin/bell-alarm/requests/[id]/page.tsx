import { notFound } from "next/navigation";
import { requireBellAlarmAdmin } from "@/lib/bell-alarm/access";
import { getBellAlarmRequestById } from "@/services/bell-alarm-requests";
import { BellAlarmRequestActions } from "@/components/bell-alarm/request-actions";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireBellAlarmAdmin();
  const x = await getBellAlarmRequestById((await params).id);
  if (!x) return notFound();
  return (
    <main className="max-w-5xl p-6">
      <p className="text-sm text-slate-500">{x.referenceNumber}</p>
      <h1 className="mt-2 text-3xl font-black">
        {x.systemType || "Bell/alarm enquiry"}
      </h1>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <section className="rounded-xl border p-5">
          <h2 className="font-bold">Customer</h2>
          <p className="mt-2">
            {x.customerName}
            <br />
            {x.companyName}
            <br />
            {x.customerEmail}
            <br />
            {x.customerPhone || x.whatsappNumber}
          </p>
        </section>
        <section className="rounded-xl border p-5">
          <h2 className="font-bold">Requirements</h2>
          <p className="mt-2">
            {x.requestType} · {x.intendedApplication} ·{" "}
            {x.operatingModePreference}
          </p>
          <p className="mt-2">
            Buildings {x.numberOfBuildings} · Zones {x.numberOfZones} · Points{" "}
            {x.numberOfBellPoints} · Speakers {x.numberOfSpeakers}
          </p>
        </section>
        <section className="rounded-xl border p-5 md:col-span-2">
          <h2 className="font-bold">Location and schedule</h2>
          <p className="mt-2">
            {[x.venueName, x.address, x.city, x.state, x.country]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p className="mt-2 whitespace-pre-wrap">
            {x.scheduleRequirements || x.message}
          </p>
        </section>
      </div>
      <div className="mt-6">
        <BellAlarmRequestActions id={x.id} version={x.version} />
      </div>
    </main>
  );
}
