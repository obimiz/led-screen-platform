import { requireSalesAdmin } from "@/lib/sales/access";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuotationDocument } from "@/components/sales/quotation-document";
import { QuotationActions } from "@/components/sales/quotation-actions";
import { SalesHeading, linkClass } from "@/components/sales/ui";
import { getQuotationById } from "@/services/sales";
import { getDocumentBusinessSettings } from "@/services/business-settings";
export default async function QuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSalesAdmin();
  const quotation = await getQuotationById((await params).id);
  if (!quotation) notFound();
  return (
    <>
      <SalesHeading title={quotation.quotationNumber} />
      <QuotationActions key={quotation.version} quotation={quotation} />
      <QuotationDocument
        quotation={quotation}
        business={await getDocumentBusinessSettings()}
      />
      <section className="no-print mt-6 rounded-lg border border-slate-200 bg-white p-5 text-sm">
        <h2 className="mb-3 font-bold">Activity</h2>
        <p>
          Created by {quotation.createdByName} ·{" "}
          {new Date(quotation.createdAt).toLocaleString()}
        </p>
        <p>
          Updated by {quotation.updatedByName} ·{" "}
          {new Date(quotation.updatedAt).toLocaleString()}
        </p>
        {[
          ["Accepted", quotation.acceptedAt],
          ["Rejected", quotation.rejectedAt],
          ["Converted to sale", quotation.convertedToSaleAt],
        ]
          .filter(([, date]) => date)
          .map(([label, date]) => (
            <p key={label}>
              {label}: {new Date(date).toLocaleString()}
            </p>
          ))}
        {quotation.quoteRequestId && (
          <Link
            className={`${linkClass} mt-3 inline-block`}
            href={`/admin/sales/enquiries/${quotation.quoteRequestId}`}
          >
            View original enquiry
          </Link>
        )}
      </section>
      <Link
        className={`${linkClass} no-print mt-5 inline-block`}
        href="/admin/sales/quotations"
      >
        Back to quotations
      </Link>
    </>
  );
}
