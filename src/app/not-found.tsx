import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-950 px-6 text-center text-white">
      <div>
        <p className="text-sm font-black tracking-[0.3em] text-cyan-300">404</p>
        <h1 className="mt-4 text-4xl font-black">Page not found</h1>
        <p className="mt-4 text-slate-300">
          The page you requested may have moved or does not exist.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-cyan-400 px-5 py-3 font-bold text-slate-950"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
