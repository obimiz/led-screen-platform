/* eslint-disable @typescript-eslint/no-explicit-any */ import Link from "next/link";
import { requireBellAlarmAdmin } from "@/lib/bell-alarm/access";
import { getBellAlarmRequests } from "@/services/bell-alarm-requests";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireBellAlarmAdmin();
  const rows = await getBellAlarmRequests();
  return (
    <main className="p-6">
      <h1 className="text-3xl font-black">Bell & alarm requests</h1>
      {rows.length === 0 ? (
        <p className="mt-8">No electronic bell/alarm requests yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3">Reference</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Request</th>
                <th className="p-3">Location</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x: any) => (
                <tr key={x.id} className="border-b">
                  <td className="p-3">
                    <Link
                      className="text-brand-700 font-bold"
                      href={`/admin/bell-alarm/requests/${x.id}`}
                    >
                      {x.referenceNumber}
                    </Link>
                  </td>
                  <td className="p-3">
                    {x.customerName}
                    <br />
                    {x.companyName}
                  </td>
                  <td className="p-3">
                    {x.requestType}
                    <br />
                    {x.systemType || x.productNameSnapshot}
                  </td>
                  <td className="p-3">
                    {[x.city, x.state].filter(Boolean).join(", ")}
                  </td>
                  <td className="p-3">{x.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
