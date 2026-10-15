"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-black">Music is temporarily unavailable</h1>
      <p className="mt-4">Please try loading the library again.</p>
      <button
        className="bg-primary mt-5 rounded-lg px-5 py-3 text-white"
        onClick={reset}
      >
        Try again
      </button>
    </main>
  );
}
