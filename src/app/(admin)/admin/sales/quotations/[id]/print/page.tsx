import { requireSalesAdmin } from "@/lib/sales/access";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuotationDocument } from "@/components/sales/quotation-document";
import { PrintButton } from "@/components/sales/quotation-actions";
import { getQuotationById } from "@/services/sales";
import { getDocumentBusinessSettings } from "@/services/business-settings";
export default async function PrintQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSalesAdmin();
  const quotation = await getQuotationById((await params).id);
  if (!quotation) notFound();
  return (
    <div className="quotation-print-view">
      <div className="no-print mx-auto mb-6 flex max-w-5xl flex-wrap items-center gap-5">
        <PrintButton />
        <Link
          className="underline"
          href={`/admin/sales/quotations/${quotation.id}`}
        >
          Back to quotation
        </Link>
        <p className="text-sm text-slate-600">
          Choose A4 and “Save as PDF” in your browser. Turn off browser headers
          and footers.
        </p>
      </div>
      <QuotationDocument
        quotation={quotation}
        business={await getDocumentBusinessSettings()}
      />
    </div>
  );
}
