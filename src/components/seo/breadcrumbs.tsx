import Link from "next/link";
import { JsonLd } from "./json-ld";
import {
  buildBreadcrumbJsonLd,
  type Breadcrumb,
} from "@/lib/seo/structured-data";
export function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  const trail = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="mx-auto max-w-7xl px-4 py-4 text-sm sm:px-6"
      >
        <ol className="flex flex-wrap gap-2">
          {trail.map((item, index) => (
            <li key={item.path}>
              {index > 0 && (
                <span aria-hidden="true" className="mr-2">
                  /
                </span>
              )}
              {index === trail.length - 1 ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <Link className="underline" href={item.path}>
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </>
  );
}
