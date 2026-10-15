import { musicMutation } from "@/lib/music/access";
import { apiSuccess } from "@/lib/api/responses";
import { salesBody } from "@/lib/sales/api";
import { updateMusicCategory } from "@/services/music";
export async function PUT(r: Request, c: { params: Promise<{ id: string }> }) {
  return musicMutation(r, async () =>
    apiSuccess(
      "Category saved",
      await updateMusicCategory((await c.params).id, await salesBody(r)),
    ),
  );
}
