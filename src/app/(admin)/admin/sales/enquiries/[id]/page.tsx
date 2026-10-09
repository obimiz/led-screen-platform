import { requireSalesAdmin } from "@/lib/sales/access";
import { notFound } from "next/navigation";
import { EnquiryDetail } from "@/components/sales/enquiry-detail";
import { getQuoteRequestById, getSalesAdmins } from "@/services/sales";
export default async function EnquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSalesAdmin();
  const enquiry = await getQuoteRequestById((await params).id);
  if (!enquiry) notFound();
  return (
    <EnquiryDetail
      key={`${enquiry.id}-${enquiry.version}`}
      enquiry={enquiry}
      admins={await getSalesAdmins()}
    />
  );
}
