import { apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { updateGalleryCategory } from "@/services/gallery";
export async function PUT(r: Request, c: { params: Promise<{ id: string }> }) {
  return salesApi(async () =>
    apiSuccess(
      "Category updated",
      await updateGalleryCategory((await c.params).id, await salesBody(r)),
    ),
  );
}
