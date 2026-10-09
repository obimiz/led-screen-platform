import { OrganisationManager } from "@/components/organisations/organisation-manager";
export default function OrganisationsPage() {
  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-black">Organisations</h1>
      <p className="mt-3 mb-8 text-slate-600">
        Manage independent organisation listings. Active, featured organisations
        appear on the homepage in display order.
      </p>
      <OrganisationManager />
    </section>
  );
}
