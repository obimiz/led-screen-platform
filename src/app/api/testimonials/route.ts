import { apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { createTestimonial, getTestimonials } from "@/services/gallery";
export async function GET() {
  return salesApi(async () =>
    apiSuccess("Testimonials loaded", await getTestimonials()),
  );
}
export async function POST(r: Request) {
  return salesApi(async (a) =>
    apiSuccess(
      "Testimonial created",
      await createTestimonial(await salesBody(r), a.id),
      201,
    ),
  );
}
