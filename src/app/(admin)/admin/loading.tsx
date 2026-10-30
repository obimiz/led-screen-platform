export default function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-slate-50">
      <div
        role="status"
        className="flex items-center gap-3 text-sm font-semibold text-slate-600"
      >
        <span className="border-t-brand-600 size-5 animate-spin rounded-full border-2 border-slate-300" />
        Loading…
      </div>
    </div>
  );
}
