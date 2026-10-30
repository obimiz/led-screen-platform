/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { requireInstallationAdmin } from "@/lib/installations/access";
import { getInstallationProjects } from "@/services/installations";
export const dynamic = "force-dynamic";
export default async function Projects() {
  await requireInstallationAdmin();
  const rows = await getInstallationProjects();
  return (
    <main className="p-6">
      <h1 className="text-3xl font-black">Installation projects</h1>
      {rows.length === 0 ? (
        <p className="mt-8">No active installation projects.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {rows.map((x: any) => (
            <Link
              key={x.id}
              href={`/admin/installations/projects/${x.id}`}
              className="rounded-xl border p-5"
            >
              <p className="text-sm text-slate-500">{x.projectNumber}</p>
              <h2 className="mt-1 text-xl font-bold">
                {x.projectName || "Installation project"}
              </h2>
              <p className="mt-2">
                {x.customerSnapshot?.name} · {x.status} · {x.progressPercentage}
                %
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
