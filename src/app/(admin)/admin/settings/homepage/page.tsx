import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getHomepageImages } from "@/services/homepage-images";
import { HomepageImagesForm } from "@/components/home/homepage-images-form";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-3xl font-black">Homepage Images</h1>
      <HomepageImagesForm initial={await getHomepageImages()} />
    </section>
  );
}
