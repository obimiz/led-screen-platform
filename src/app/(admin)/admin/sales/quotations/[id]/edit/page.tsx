import { requireSalesAdmin } from "@/lib/sales/access";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuotationForm } from "@/components/sales/quotation-form";
import { getQuotationById } from "@/services/sales";
export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSalesAdmin();
  const quotation = await getQuotationById((await params).id);
  if (!quotation) notFound();
  if (quotation.status !== "draft")
    return (
      <div>
        <h1 className="text-2xl font-bold">This quotation is not a draft.</h1>
        <p className="my-4">
          Reopen it as draft from the detail page before editing. Converted
          quotations are locked.
        </p>
        <Link
          className="underline"
          href={`/admin/sales/quotations/${quotation.id}`}
        >
          View quotation
        </Link>
      </div>
    );
  return (
    <QuotationForm
      key={`${quotation.id}-${quotation.version}`}
      quotation={quotation}
    />
  );
}
