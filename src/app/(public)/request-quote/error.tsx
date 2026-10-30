"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl p-12">
      <h1 className="text-2xl font-bold">
        We couldn&apos;t load the quotation form.
      </h1>
      <p className="my-4">Please try again in a moment.</p>
      <button
        onClick={reset}
        className="bg-primary hover:bg-primary-hover rounded-lg px-4 py-2 text-white"
      >
        Try again
      </button>
    </div>
  );
}
