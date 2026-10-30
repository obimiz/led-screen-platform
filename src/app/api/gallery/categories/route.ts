import { apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import {
  createGalleryCategory,
  getGalleryCategories,
} from "@/services/gallery";
export async function GET() {
  return apiSuccess("Categories loaded", await getGalleryCategories());
}
export async function POST(r: Request) {
  return salesApi(async () =>
    apiSuccess(
      "Category created",
      await createGalleryCategory(await salesBody(r)),
      201,
    ),
  );
}
