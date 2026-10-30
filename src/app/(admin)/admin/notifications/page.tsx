import { requireSalesAdmin } from "@/lib/sales/access";
import { getAdminNotifications } from "@/services/notifications";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function Page() {
  const admin = await requireSalesAdmin();
  const rows = await getAdminNotifications(admin.id);
  return (
    <main className="p-6">
      <h1 className="text-3xl font-black">Notifications</h1>
      <div className="mt-8 space-y-3">
        {rows.map((n: any) => (
          <Link
            key={n.id}
            href={n.actionUrl || "/admin/notifications"}
            className={`block rounded-xl border p-4 ${n.isRead ? "bg-white" : "border-brand-300 bg-brand-50"}`}
          >
            <div className="flex justify-between gap-3">
              <strong>{n.title}</strong>
              <span className="text-xs text-slate-500">
                {new Date(n.createdAt).toLocaleString("en-NG")}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{n.message}</p>
            <p className="mt-2 text-xs text-slate-500 uppercase">
              {n.type} · {n.priority} · {n.status}
            </p>
          </Link>
        ))}
        {!rows.length && (
          <p className="rounded-xl border border-dashed p-8">
            No notifications yet.
          </p>
        )}
      </div>
    </main>
  );
}
