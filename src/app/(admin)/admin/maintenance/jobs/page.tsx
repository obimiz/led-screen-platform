/* eslint-disable @typescript-eslint/no-explicit-any */ import Link from "next/link";
import { requireMaintenanceAdmin } from "@/lib/maintenance/access";
import { getMaintenanceJobs } from "@/services/maintenance";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireMaintenanceAdmin();
  const rows = await getMaintenanceJobs();
  return (
    <main className="p-6">
      <h1 className="text-3xl font-black">Maintenance jobs</h1>
      {rows.length === 0 ? (
        <p className="mt-8">No active maintenance jobs.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {rows.map((x: any) => (
            <Link
              key={x.id}
              href={`/admin/maintenance/jobs/${x.id}`}
              className="rounded-xl border p-5"
            >
              <p className="text-sm text-slate-500">{x.jobNumber}</p>
              <h2 className="mt-1 text-xl font-bold">
                {x.customerSnapshot?.name}
              </h2>
              <p className="mt-2">
                {x.reportedIssue} · {x.status}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
