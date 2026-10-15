import { apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { createGalleryItem, getGalleryPage } from "@/services/gallery";
export async function GET(r: Request) {
  return salesApi(async () =>
    apiSuccess(
      "Gallery loaded",
      await getGalleryPage(Object.fromEntries(new URL(r.url).searchParams)),
    ),
  );
}
export async function POST(r: Request) {
  return salesApi(async (a) =>
    apiSuccess(
      "Gallery item created",
      await createGalleryItem(await salesBody(r), a.id),
      201,
    ),
  );
}
