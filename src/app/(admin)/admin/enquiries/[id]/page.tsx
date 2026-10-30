import { notFound } from "next/navigation";
import { requireSalesAdmin } from "@/lib/sales/access";
import { getContactEnquiryById } from "@/services/contact-enquiries";
import {
  createPhoneUrl,
  createEmailUrl,
  createWhatsAppUrl,
} from "@/lib/utils/contact";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSalesAdmin();
  const x = await getContactEnquiryById((await params).id);
  if (!x) return notFound();
  const wa = createWhatsAppUrl({
    phone: x.whatsappNumber || x.phone,
    message: `Hello ${x.name}, regarding your enquiry ${x.referenceNumber}.`,
  });
  return (
    <main className="p-6">
      <h1 className="text-3xl font-black">{x.referenceNumber}</h1>
      <p className="mt-2 text-slate-600">
        {x.subject} · {x.enquiryType} · {x.priority} · {x.status}
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border p-5">
          <h2 className="font-bold">Customer</h2>
          <p className="mt-3">{x.name}</p>
          {x.email && (
            <a className="text-brand-700 block" href={createEmailUrl(x.email)}>
              {x.email}
            </a>
          )}
          {x.phone && (
            <a className="text-brand-700 block" href={createPhoneUrl(x.phone)}>
              {x.phone}
            </a>
          )}
          {wa && (
            <a
              className="bg-success-500 text-brand-900 mt-3 inline-block rounded-lg px-4 py-2 font-bold"
              href={wa}
              target="_blank"
              rel="noreferrer"
            >
              Open WhatsApp
            </a>
          )}
        </section>
        <section className="rounded-xl border p-5">
          <h2 className="font-bold">Enquiry</h2>
          <p className="mt-3 whitespace-pre-line text-slate-700">{x.message}</p>
          <p className="mt-4 text-sm text-slate-500">
            Source: {x.source} · {x.sourcePage}
          </p>
        </section>
      </div>
    </main>
  );
}
