import { RentalList } from "@/components/rentals/rental-list";
import { requireRentalAdmin } from "@/lib/rentals/access";
export default async function RentalRequestsPage() {
  await requireRentalAdmin();
  return <RentalList kind="requests" />;
}
