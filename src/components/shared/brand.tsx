import Link from "next/link";
import Image from "next/image";

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
  void businessName;
  void shortName;
  void logoUrl;
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-white/20">
        <Image src="/branding/image-grant-technology-logo.jpeg" alt="Image Grant Technology logo" fill sizes="44px" className="object-contain p-0.5" priority />
      </span>
      <span className="max-w-52 text-sm font-extrabold leading-tight tracking-tight text-white sm:text-base">
        Image Grant Technology
      </span>
    </Link>
  );
}
