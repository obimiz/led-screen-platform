"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  enquiryStatuses,
  enquirySources,
  projectTypes,
  quotationStatuses,
  salesCurrencies,
} from "@/lib/sales/constants";
import { formatMoney } from "@/lib/sales/calculations";
import type {
  AdminOption,
  Enquiry,
  Quotation,
  SalesList as ListResult,
} from "@/types/sales";
import { salesFetch } from "./client-api";
import {
  Field,
  SalesHeading,
  Status,
  buttonClass,
  inputClass,
  linkClass,
} from "./ui";
export function SalesList({
  kind,
  admins = [],
}: {
  kind: "enquiries" | "quotations";
  admins?: AdminOption[];
}) {
  const [query, setQuery] = useState("page=1");
  const enquiries = kind === "enquiries";
  const { data, error, isPending } = useQuery({
    queryKey: ["sales", kind, query],
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: () =>
      salesFetch<ListResult<Enquiry | Quotation>>(
        `/api/${enquiries ? "quote-requests" : "quotations"}?${query}`,
      ),
  });
  const filter = (name: string, label: string, values: readonly string[]) => (
    <Field label={label}>
      <select name={name} className={inputClass}>
        <option value="">All</option>
        {values.map((v) => (
          <option key={v} value={v}>
            {v.replaceAll("-", " ")}
          </option>
        ))}
      </select>
    </Field>
  );
  return (
    <>
      <SalesHeading
        title={enquiries ? "Sales enquiries" : "Quotations"}
        description={
          enquiries
            ? "Review incoming requirements and prepare a formal quotation."
            : "Prepare, track and print customer quotations."
        }
      >
        {!enquiries && (
          <Link className={buttonClass} href="/admin/sales/quotations/new">
            New quotation
          </Link>
        )}
      </SalesHeading>
      <form
        className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          const params = new URLSearchParams();
          values.forEach((v, k) => {
            if (String(v)) params.set(k, String(v));
          });
          params.set("page", "1");
          setQuery(params.toString());
        }}
      >
        <Field label="Search">
          <input
            name="search"
            maxLength={100}
            className={inputClass}
            placeholder="Reference, name, company, phone, email"
          />
        </Field>
        {filter(
          "status",
          "Status",
          enquiries ? enquiryStatuses : quotationStatuses,
        )}
        {enquiries ? (
          <>
            {filter("source", "Source", enquirySources)}
            {filter("projectType", "Project type", projectTypes)}
            <Field label="Assigned admin">
              <select name="assignedTo" className={inputClass}>
                <option value="">All</option>
                <option value="unassigned">Unassigned</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
          </>
        ) : (
          filter("currency", "Currency", salesCurrencies)
        )}
        <Field label="Created from">
          <input name="from" type="date" className={inputClass} />
        </Field>
        <Field label="Created through">
          <input name="to" type="date" className={inputClass} />
        </Field>
        <div className="flex items-end gap-2">
          <button className={buttonClass}>Apply filters</button>
          <button
            type="reset"
            onClick={() => setQuery("page=1")}
            className={linkClass}
          >
            Reset
          </button>
        </div>
      </form>
      {isPending && <p role="status">Loading {kind}…</p>}
      {error && (
        <p role="alert" className="text-red-700">
          {error.message}
        </p>
      )}
      {data && (
        <>
          {data.records.length ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {(enquiries
                      ? [
                          "Reference",
                          "Customer / company",
                          "Phone",
                          "Product / project",
                          "Location",
                          "Status",
                          "Assigned",
                          "Created",
                          "Actions",
                        ]
                      : [
                          "Quotation",
                          "Customer / company",
                          "Total",
                          "Status",
                          "Valid until",
                          "Created",
                          "Updated",
                          "Actions",
                        ]
                    ).map((h) => (
                      <th className="p-4 whitespace-nowrap" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((record) =>
                    "referenceNumber" in record ? (
                      <tr key={record.id} className="border-t border-slate-100">
                        <td className="p-4 font-semibold whitespace-nowrap">
                          {record.referenceNumber}
                        </td>
                        <td className="p-4">
                          {record.customerName}
                          <p className="text-xs text-slate-500">
                            {record.companyName}
                          </p>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {record.customerPhone || record.whatsappNumber || "—"}
                        </td>
                        <td className="p-4">
                          {record.productNameSnapshot || "General enquiry"}
                          <p className="text-xs">{record.projectType}</p>
                        </td>
                        <td className="p-4">
                          {[record.city, record.state, record.country]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </td>
                        <td className="p-4">
                          <Status value={record.status} />
                        </td>
                        <td className="p-4">{record.assignedName}</td>
                        <td className="p-4 whitespace-nowrap">
                          {record.createdAt.slice(0, 10)}
                        </td>
                        <td className="p-4">
                          <Link
                            className={linkClass}
                            href={`/admin/sales/enquiries/${record.id}`}
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      <tr key={record.id} className="border-t border-slate-100">
                        <td className="p-4 font-semibold whitespace-nowrap">
                          {record.quotationNumber}
                        </td>
                        <td className="p-4">
                          {record.customer.name}
                          <p className="text-xs text-slate-500">
                            {record.customer.companyName}
                          </p>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {formatMoney(record.total, record.currency)}
                          <p className="text-xs">{record.currency}</p>
                        </td>
                        <td className="p-4">
                          <Status value={record.effectiveStatus} />
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {record.validUntil.slice(0, 10)}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {record.createdAt.slice(0, 10)}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {record.updatedAt.slice(0, 10)}
                        </td>
                        <td className="p-4">
                          <Link
                            className={linkClass}
                            href={`/admin/sales/quotations/${record.id}`}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <p>
                {enquiries
                  ? "No sales enquiries yet."
                  : "No quotations have been created yet."}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try changing your filters, or{" "}
                {enquiries
                  ? "share the request form with a customer."
                  : "create your first quotation."}
              </p>
              <Link
                className={`${linkClass} mt-4 inline-block`}
                href={
                  enquiries ? "/request-quote" : "/admin/sales/quotations/new"
                }
              >
                {enquiries ? "Open request form" : "New quotation"}
              </Link>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <span>
              {data.total} results · Page {data.page} of {data.pages}
            </span>
            <div className="flex gap-2">
              {[
                [-1, "Previous"],
                [1, "Next"],
              ].map(([step, label]) => (
                <button
                  key={label}
                  className={buttonClass}
                  disabled={
                    step === -1 ? data.page <= 1 : data.page >= data.pages
                  }
                  onClick={() => {
                    const p = new URLSearchParams(query);
                    p.set("page", String(data.page + Number(step)));
                    setQuery(p.toString());
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
