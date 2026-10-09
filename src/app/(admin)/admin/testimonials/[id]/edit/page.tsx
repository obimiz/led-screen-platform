import { requireGalleryAdmin } from "@/lib/gallery/access";
import { getTestimonials } from "@/services/gallery";
import { TestimonialForm } from "@/components/gallery/testimonial-form";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { await requireGalleryAdmin(); const id = (await params).id; const item = (await getTestimonials()).find((x: any) => x.id === id); if (!item) return <main className="p-6">Testimonial not found.</main>; return <main className="p-6"><h1 className="text-3xl font-black">Edit testimonial</h1><p className="mb-4 text-sm text-slate-500">Editing {item.customerDisplayName}; submit changes through the testimonial form.</p><TestimonialForm /></main>; }
