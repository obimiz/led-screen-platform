import { requireBellAlarmAdmin } from "@/lib/bell-alarm/access";
import { getBellPage } from "@/services/bell-page";
import { BellPageEditor } from "@/components/content/bell-page-editor";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireBellAlarmAdmin();
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-3xl font-black">Electronic Bell & Alarm page</h1>
      <BellPageEditor initial={await getBellPage(true)} />
    </section>
  );
}
