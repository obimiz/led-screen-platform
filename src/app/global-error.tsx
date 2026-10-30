"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="bg-brand-900 grid min-h-dvh place-items-center px-6 text-center text-white">
          <div>
            <h1 className="text-3xl font-black">Something went wrong</h1>
            <p className="mt-3 text-slate-300">
              We could not complete that request. Please try again.
            </p>
            <button
              type="button"
              onClick={reset}
              className="bg-primary mt-7 rounded-lg px-5 py-3 font-bold text-white"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
