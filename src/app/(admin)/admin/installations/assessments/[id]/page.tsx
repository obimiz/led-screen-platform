import { notFound } from "next/navigation";
import { requireInstallationAdmin } from "@/lib/installations/access";
import { getSiteAssessmentById } from "@/services/installations";
export const dynamic = "force-dynamic";
export default async function Assessment({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireInstallationAdmin();
  const x = await getSiteAssessmentById((await params).id);
  if (!x) return notFound();
  return (
    <main className="max-w-4xl p-6">
      <p className="text-sm text-slate-500">{x.assessmentNumber}</p>
      <h1 className="mt-2 text-3xl font-black">Site assessment</h1>
      <div className="mt-6 rounded-xl border p-5">
        <p>Status: {x.status}</p>
        <p className="mt-2">
          Scheduled: {x.scheduledDate || "Not scheduled"} {x.scheduledTime}
        </p>
        <p className="mt-4 whitespace-pre-wrap">
          {x.technicianNotes ||
            x.safetyNotes ||
            "Assessment notes can be added through the assessment API."}
        </p>
      </div>
    </main>
  );
}
