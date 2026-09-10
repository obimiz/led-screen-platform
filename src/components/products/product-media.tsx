export function ProductImage({
  url,
  name,
  className = "aspect-video",
}: {
  url: string;
  name: string;
  className?: string;
}) {
  return url ? (
    <span
      role="img"
      aria-label={name}
      style={{ backgroundImage: `url(${JSON.stringify(url).slice(1, -1)})` }}
      className={`block bg-slate-100 bg-cover bg-center ${className}`}
    />
  ) : (
    <span
      className={`grid place-items-center bg-slate-100 text-sm text-slate-400 ${className}`}
    >
      No image
    </span>
  );
}
