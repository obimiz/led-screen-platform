import { HomepageServicesForm } from "@/components/home/homepage-services-form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getHomepageTextSettings } from "@/services/homepage-accessories";
import {
  HomepageAccessoriesForm,
  HomepageHeroForm,
} from "@/components/home/homepage-accessories-form";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const settings = await getHomepageTextSettings();
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-black">Homepage Content</h1>
      <HomepageHeroForm initial={settings.hero} />
      <HomepageServicesForm initial={settings.services} />
      <HomepageAccessoriesForm initial={settings.accessories} />
      <p className="leading-7 text-slate-600">
        The Bell and Camera sections use published featured products. Edit a
        product&apos;s name, short description and photographs to update its
        homepage section. There are no separate homepage text or image
        overrides.
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3 rounded-xl border p-5">
          <h2 className="text-xl font-bold">Electronic Bell products</h2>
          <p className="text-slate-600">
            Publish a bell product and mark it Featured. Its name becomes the
            homepage heading.
          </p>
          <Link
            href="/admin/bell-alarm/products"
            className="text-brand-700 block font-bold underline"
          >
            Manage Bell products
          </Link>
        </div>
        <div className="space-y-3 rounded-xl border p-5">
          <h2 className="text-xl font-bold">Cameras in LED Accessories</h2>
          <p className="text-slate-600">
            Choose the LED Screen Cameras category or Camera / live video
            classification, then publish and mark Featured.
          </p>
          <Link
            href="/admin/accessories"
            className="text-brand-700 block font-bold underline"
          >
            Manage camera products
          </Link>
        </div>
        <div className="space-y-3 rounded-xl border p-5 sm:col-span-2">
          <h2 className="text-xl font-bold">Video Accessories cards</h2>
          <p className="text-slate-600">
            Add a product in Accessories and choose the Video accessory homepage
            classification, or a video category such as Video Processors.
            Publish the product with a name, short description and photographs.
            These populate its homepage card automatically.
          </p>
          <Link
            href="/admin/accessories"
            className="text-brand-700 block font-bold underline"
          >
            Manage video accessories
          </Link>
        </div>
      </div>
      <p className="text-sm text-slate-600">
        When several products are featured, the most recently updated is
        selected first. Draft and archived products stay hidden.
      </p>
      <Link
        href="/"
        target="_blank"
        className="inline-block font-bold underline"
      >
        View homepage
      </Link>
    </section>
  );
}
