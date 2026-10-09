import Image from "next/image";
import type { Quotation } from "@/types/sales";
import type { PublicBusinessSettings } from "@/types/business-settings";
import { formatMoney } from "@/lib/sales/calculations";
import { Status } from "./ui";
export function QuotationDocument({
  quotation: q,
  business,
}: {
  quotation: Quotation;
  business: PublicBusinessSettings;
}) {
  const money = (value: number) => formatMoney(value, q.currency);
  return (
    <article className="quotation-document mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-5 text-slate-950 sm:p-10">
      <header className="flex flex-wrap justify-between gap-6 border-b-2 border-slate-900 pb-6">
        <div>
          <div>
            <Image
              width={224}
              height={64}
              unoptimized
              src="/branding/image-grant-technology-logo.jpeg"
              alt={`${business.businessName} logo`}
              className="mb-4 h-16 max-w-56 object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold">{business.businessName}</h2>
          <p className="mt-2 max-w-sm text-sm whitespace-pre-wrap">
            {business.address}
          </p>
          <p className="mt-2 text-sm">
            {[business.primaryPhone, business.primaryEmail]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {business.whatsappNumber && (
            <p className="text-sm">WhatsApp: {business.whatsappNumber}</p>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-light tracking-widest uppercase">
            Quotation
          </p>
          <p className="font-bold">{q.quotationNumber}</p>
          <p className="text-sm">Date: {q.createdAt.slice(0, 10)}</p>
          <p className="text-sm">Valid until: {q.validUntil.slice(0, 10)}</p>
          <Status value={q.effectiveStatus} />
        </div>
      </header>
      <div className="my-7 grid gap-6 sm:grid-cols-2">
        <section>
          <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
            Prepared for
          </h3>
          <p className="mt-2 font-bold">{q.customer.name}</p>
          <p>{q.customer.companyName}</p>
          <p className="text-sm">{q.customer.email}</p>
          <p className="text-sm">{q.customer.phone}</p>
          {q.customer.whatsappNumber && (
            <p className="text-sm">WhatsApp: {q.customer.whatsappNumber}</p>
          )}
          {q.billingAddress && (
            <p className="mt-3 text-sm whitespace-pre-wrap">
              {q.billingAddress}
            </p>
          )}
        </section>
        {q.deliveryAddress && (
          <section>
            <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Delivery / installation address
            </h3>
            <p className="mt-2 text-sm whitespace-pre-wrap">
              {q.deliveryAddress}
            </p>
          </section>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-y border-slate-300 bg-slate-50">
              <th className="py-3 pr-3">Description</th>
              <th className="px-2 py-3 text-right">Qty / unit</th>
              <th className="px-2 py-3 text-right">Unit price</th>
              <th className="px-2 py-3 text-right">Discount</th>
              <th className="py-3 pl-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {q.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-200 align-top">
                <td className="py-4 pr-3">
                  <p className="font-semibold">{item.name}</p>
                  {item.skuSnapshot && (
                    <p className="text-xs text-slate-500">
                      SKU: {item.skuSnapshot}
                    </p>
                  )}
                  <p className="mt-1 max-w-md text-xs whitespace-pre-wrap text-slate-600">
                    {item.description}
                  </p>
                </td>
                <td className="px-2 py-4 text-right">
                  {item.quantity} {item.unit}
                </td>
                <td className="px-2 py-4 text-right whitespace-nowrap">
                  {money(item.unitPrice)}
                </td>
                <td className="px-2 py-4 text-right whitespace-nowrap">
                  {money(item.discount)}
                </td>
                <td className="py-4 pl-2 text-right font-semibold whitespace-nowrap">
                  {money(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="mt-6 ml-auto max-w-sm space-y-2 text-sm">
        {[
          ["Subtotal", q.subtotal],
          ["Discount", -q.discountAmount],
          [`Tax (${q.taxRate}%)`, q.taxAmount],
          ["Delivery", q.deliveryFee],
          ["Installation", q.installationFee],
          ["Other charges", q.otherCharges],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-6">
            <dt>{label}</dt>
            <dd>{money(Number(value))}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-6 border-t-2 border-slate-900 pt-3 text-lg font-bold">
          <dt>Total ({q.currency})</dt>
          <dd>{money(q.total)}</dd>
        </div>
      </dl>
      {q.notes && (
        <section className="mt-8 border-t border-slate-200 pt-5">
          <h3 className="font-bold">Notes</h3>
          <p className="mt-2 text-sm whitespace-pre-wrap">{q.notes}</p>
        </section>
      )}
      {q.terms && (
        <section className="mt-6">
          <h3 className="font-bold">Terms</h3>
          <p className="mt-2 text-sm whitespace-pre-wrap">{q.terms}</p>
        </section>
      )}
      <footer className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
        Please quote {q.quotationNumber} in your correspondence. This quotation
        is not a payment receipt.
      </footer>
    </article>
  );
}
