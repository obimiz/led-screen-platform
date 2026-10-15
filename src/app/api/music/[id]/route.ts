import { musicMutation } from "@/lib/music/access";
import { apiNotFound, apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import {
  getMusicById,
  getMusicPublicById,
  updateMusicContent,
} from "@/services/music";
export async function GET(_: Request, c: { params: Promise<{ id: string }> }) {
  const id = (await c.params).id;
  const admin = await getCurrentAdmin();
  if (admin)
    return salesApi(async () => {
      const d = await getMusicById(id);
      return d ? apiSuccess("Music loaded", d) : apiNotFound();
    });
  const d = await getMusicPublicById(id);
  const response = d ? apiSuccess("Music loaded", d) : apiNotFound();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export async function PUT(r: Request, c: { params: Promise<{ id: string }> }) {
  return musicMutation(r, async (a) =>
    apiSuccess(
      "Music saved",
      await updateMusicContent((await c.params).id, await salesBody(r), a.id),
    ),
  );
}
