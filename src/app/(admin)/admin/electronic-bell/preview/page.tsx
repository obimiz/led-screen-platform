import { requireBellAlarmAdmin } from "@/lib/bell-alarm/access";
import { getBellPage } from "@/services/bell-page";
import { BellPageView } from "@/components/content/bell-page-view";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function Page() {
  await requireBellAlarmAdmin();
  return (
    <>
      <p className="bg-amber-100 p-4 font-bold">Draft preview</p>
      <BellPageView content={await getBellPage(true)} />
    </>
  );
}
