import { redirect } from "next/navigation";

export default function BellAlarmCategoriesPage() {
  redirect("/admin/product-categories?productType=bell-alarm-system");
}
