import { redirect } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  redirect(`/admin/blog/${(await params).id}/edit`);
}
