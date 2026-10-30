import type { ReactNode } from "react";
export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100";
export const buttonClass =
  "inline-flex items-center justify-center rounded-lg bg-primary hover:bg-primary-hover px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50";
export const linkClass =
  "font-semibold text-brand-800 underline underline-offset-4";
export function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {hint && (
        <span className="block text-xs font-normal text-slate-500">{hint}</span>
      )}
      {error && (
        <span role="alert" className="block text-xs text-red-700">
          {error}
        </span>
      )}
    </label>
  );
}
export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <legend className="px-2 text-lg font-bold">{title}</legend>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 capitalize">
      {value}
    </span>
  );
}
export function SalesHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-brand-700 mb-2 text-xs font-bold tracking-widest uppercase">
          Sales
        </p>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-slate-600">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
