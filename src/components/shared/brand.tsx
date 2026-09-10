import Link from "next/link";

import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

export function Brand({
  className,
  businessName = siteConfig.name,
  shortName = "",
  logoUrl = "",
}: {
  className?: string;
  businessName?: string;
  shortName?: string;
  logoUrl?: string;
}) {
  const mark =
    (shortName || businessName).trim().charAt(0).toUpperCase() || "L";

  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        style={
          logoUrl
            ? {
                backgroundImage: `url(${JSON.stringify(logoUrl).slice(1, -1)})`,
              }
            : undefined
        }
        className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan-400 bg-contain bg-center bg-no-repeat font-black text-slate-950"
      >
        {logoUrl ? <span className="sr-only">Logo</span> : mark}
      </span>
      <span className="max-w-48 text-sm font-bold tracking-wide text-white sm:text-base">
        {shortName || businessName}
      </span>
    </Link>
  );
}
