import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-brand-900 grid min-h-dvh place-items-center px-6 text-center text-white">
      <div>
        <p className="text-brand-300 text-sm font-black tracking-[0.3em]">
          404
        </p>
        <h1 className="mt-4 text-4xl font-black">Page not found</h1>
        <p className="mt-4 text-slate-300">
          The page you requested may have moved or does not exist.
        </p>
        <Link
          href="/"
          className="bg-primary mt-8 inline-block rounded-lg px-5 py-3 font-bold text-white"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
