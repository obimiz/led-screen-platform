import { notFound } from "next/navigation";
import { RentalRequestDetail } from "@/components/rentals/rental-request-detail";
import { requireRentalAdmin } from "@/lib/rentals/access";
import { getRentalRequestById } from "@/services/rentals";
import { getSalesAdmins } from "@/services/sales";
export default async function RentalRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRentalAdmin();
  const request = await getRentalRequestById((await params).id);
  if (!request) notFound();
  return (
    <RentalRequestDetail request={request} admins={await getSalesAdmins()} />
  );
}
