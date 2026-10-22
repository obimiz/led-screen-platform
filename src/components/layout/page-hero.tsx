import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
export function PageHero({
  title,
  description,
  image,
  imageAlt = "",
  eyebrow,
  cta,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  image?: string;
  imageAlt?: string;
  eyebrow?: string;
  cta?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <section
      data-page-hero
      className="relative isolate overflow-hidden bg-[#28146B] py-12 text-white sm:py-16"
    >
      {image && (
        <>
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized={!image.startsWith("/")}
          />
          <div className="absolute inset-0 bg-black/65" />
        </>
      )}
      <Container className="relative z-10">
        {eyebrow && (
          <p className="mb-3 text-sm font-bold tracking-widest uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-4xl text-3xl font-black tracking-tight break-words sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/85">
            {description}
          </p>
        )}
        {cta && (
          <Link
            href={cta.href}
            className="mt-6 inline-block rounded-lg bg-[#DD2421] px-5 py-3 font-bold text-white"
          >
            {cta.label}
          </Link>
        )}
        {children && (
          <div className="mt-6 flex flex-wrap gap-3">{children}</div>
        )}
      </Container>
    </section>
  );
}
