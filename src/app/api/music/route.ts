import { musicMutation } from "@/lib/music/access";
import { apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { createMusicContent, getMusicPage } from "@/services/music";
export async function GET(r: Request) {
  const query = Object.fromEntries(new URL(r.url).searchParams);
  if (query.admin === "1")
    return salesApi(async () =>
      apiSuccess("Music loaded", await getMusicPage(query, false)),
    );
  const response = apiSuccess(
    "Published music loaded",
    await getMusicPage(query, true),
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export async function POST(r: Request) {
  return musicMutation(r, async (a) =>
    apiSuccess(
      "Music created",
      await createMusicContent(await salesBody(r), a.id),
      201,
    ),
  );
}
