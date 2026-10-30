"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-xl bg-white p-8">
      <h2 className="text-xl font-bold">
        Sales information could not be loaded.
      </h2>
      <p className="my-4">
        Please try again. If the problem continues, check your database
        connection.
      </p>
      <button
        onClick={reset}
        className="bg-primary hover:bg-primary-hover rounded-lg px-4 py-2 text-white"
      >
        Try again
      </button>
    </div>
  );
}
