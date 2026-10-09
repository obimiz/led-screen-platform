import { requireSalesAdmin } from "@/lib/sales/access";
import { SalesList } from "@/components/sales/sales-list";
import { getSalesAdmins } from "@/services/sales";
export default async function EnquiriesPage() {
  await requireSalesAdmin();
  return <SalesList kind="enquiries" admins={await getSalesAdmins()} />;
}
