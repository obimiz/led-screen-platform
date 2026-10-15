import { musicMutation } from "@/lib/music/access";
import { apiSuccess } from "@/lib/api/responses";
import { salesBody } from "@/lib/sales/api";
import { createMusicCategory, getMusicCategories } from "@/services/music";
export async function GET() {
  return apiSuccess("Categories loaded", await getMusicCategories());
}
export async function POST(r: Request) {
  return musicMutation(r, async () =>
    apiSuccess(
      "Category created",
      await createMusicCategory(await salesBody(r)),
      201,
    ),
  );
}
