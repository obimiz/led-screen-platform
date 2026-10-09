import Link from "next/link";
export function MusicCard({ item }: { item: any }) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg">
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-brand-950 via-brand-900 to-slate-950 text-4xl text-brand-200">
        {item.coverImageUrl ? (
          <img
            src={item.coverImageUrl}
            alt={`${item.title} cover`}
            loading="lazy"
            decoding="async"
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <><span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(216,180,254,.45),transparent_25%)]" />♫</>
        )}
      </div>
      <h2 className="mt-4 font-bold">
        <Link href={item.slug ? `/music/${item.slug}` : "/music"}>{item.title}</Link>
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {item.artistName || "Curated audio"}
      </p>
      <p className="mt-1 text-xs text-brand-700 uppercase">{item.contentType}</p>
    </article>
  );
}
