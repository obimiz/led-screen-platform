"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-6xl space-y-4 p-8">
      <h1 className="text-2xl font-bold">Unable to load this content</h1>
      <p>Please try again shortly.</p>
      <button
        className="bg-primary rounded-lg px-4 py-2 font-bold text-white"
        onClick={reset}
      >
        Try again
      </button>
    </main>
  );
}
