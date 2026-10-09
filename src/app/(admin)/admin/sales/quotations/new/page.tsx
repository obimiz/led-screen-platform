import { requireSalesAdmin } from "@/lib/sales/access";
import { notFound } from "next/navigation";
import { QuotationForm } from "@/components/sales/quotation-form";
import { getQuoteRequestById, getSalesCatalogueById } from "@/services/sales";
export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ enquiry?: string }>;
}) {
  await requireSalesAdmin();
  const params = await searchParams;
  const enquiry =
    typeof params.enquiry === "string"
      ? await getQuoteRequestById(params.enquiry)
      : null;
  if (params.enquiry && !enquiry) notFound();
  const selectedProduct = enquiry?.productId
    ? await getSalesCatalogueById(enquiry.productId)
    : undefined;
  return (
    <QuotationForm
      enquiry={enquiry ?? undefined}
      selectedProduct={selectedProduct}
    />
  );
}
