"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-black">Music management is unavailable</h1>
      <p className="mt-3">
        Please try loading it again. Your saved music has been retained.
      </p>
      <button
        className="bg-primary mt-4 rounded-lg px-4 py-3 text-white"
        onClick={reset}
      >
        Try again
      </button>
    </main>
  );
}
