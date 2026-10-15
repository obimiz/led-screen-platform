import Link from "next/link";
import Image from "next/image";
import { MusicPlayer } from "./audio-player";
export type MusicCardItem = {
  id: string;
  slug?: string;
  title: string;
  artistName?: string;
  coverImageUrl?: string;
  contentType?: string;
  sourcePlatform?: string;
  audioUrl?: string;
  categoryId?: string | { name?: string; slug?: string };
  shortDescription?: string;
  description?: string;
  releaseYear?: number;
};
export function MusicCard({ item }: { item: MusicCardItem }) {
  const category =
    typeof item.categoryId === "object" ? item.categoryId?.name : "";
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="from-brand-950 via-brand-900 text-brand-200 relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br to-slate-950 text-4xl">
        {item.coverImageUrl ? (
          <Image
            src={item.coverImageUrl}
            alt={`${item.title} cover`}
            fill
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
            className="object-cover"
            unoptimized={!item.coverImageUrl.startsWith("/")}
          />
        ) : (
          <span aria-hidden="true">♫</span>
        )}
      </div>
      <h2 className="mt-4 font-bold break-words">
        <Link href={item.slug ? `/music/${item.slug}` : "/music"}>
          {item.title}
        </Link>
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {item.artistName || "Artist not specified"}
      </p>
      <p className="text-brand-700 mt-1 text-xs">
        {category || item.contentType?.replaceAll("-", " ")}
        {item.releaseYear ? ` · ${item.releaseYear}` : ""}
      </p>
      {(item.shortDescription || item.description) && (
        <p className="mt-3 text-sm text-slate-600">
          {(item.shortDescription || item.description || "").slice(0, 300)}
        </p>
      )}
      {item.sourcePlatform === "owned" && item.audioUrl ? (
        <MusicPlayer src={item.audioUrl} title={item.title} />
      ) : (
        <Link
          className="text-brand-700 mt-4 inline-block font-semibold underline"
          href={item.slug ? `/music/${item.slug}` : "/music"}
        >
          Listen / view details
        </Link>
      )}
    </article>
  );
}
