import { Container } from "@/components/ui/container";
import { OrganisationLogo } from "./organisation-logo";
import type { Organisation } from "@/lib/validations/organisation";
function Row({ items }: { items: Organisation[] }) {
  return (
    <div
      className="organisation-row"
      role="region"
      aria-label="Client organisations"
      tabIndex={0}
    >
      <div className="organisation-track">
        {[false, true].map((copy) => (
          <ul
            key={String(copy)}
            className="organisation-group"
            aria-hidden={copy || undefined}
            inert={copy || undefined}
          >
            {items.map((item) => (
              <li key={item.id} className="organisation-card">
                <OrganisationLogo name={item.name} url={item.logoUrl} />
                <p className="organisation-name">{item.name}</p>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
export function OrganisationMarquee({ items }: { items: Organisation[] }) {
  if (!items.length) return null;
  return (
    <section
      aria-labelledby="organisations-heading"
      className="organisation-section bg-slate-50 py-10 sm:py-12"
    >
      <Container>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-brand-700 mb-3 text-sm font-bold tracking-widest uppercase">
              Our clients
            </p>
            <h2
              id="organisations-heading"
              className="text-2xl font-black sm:text-3xl"
            >
              Organisations We&apos;ve Worked With
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Supporting churches, institutions, businesses and organisations
              with professional technology solutions.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 py-2 text-xs text-slate-500">
            <input
              type="checkbox"
              className="organisation-pause accent-brand-700"
            />
            Pause scrolling
          </label>
        </div>
      </Container>
      <div className="mt-8">
        <Row items={items} />
      </div>
    </section>
  );
}
