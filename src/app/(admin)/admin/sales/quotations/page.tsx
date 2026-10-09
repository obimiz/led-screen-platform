import { requireSalesAdmin } from "@/lib/sales/access";
import { SalesList } from "@/components/sales/sales-list";
export default async function QuotationsPage() {
  await requireSalesAdmin();
  return <SalesList kind="quotations" />;
}
