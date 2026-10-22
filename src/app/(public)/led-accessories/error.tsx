"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-2xl font-bold">
        Accessories are temporarily unavailable
      </h1>
      <button
        className="mt-5 rounded-lg bg-[#DD2421] px-5 py-3 font-bold text-white"
        onClick={reset}
      >
        Try again
      </button>
    </section>
  );
}
