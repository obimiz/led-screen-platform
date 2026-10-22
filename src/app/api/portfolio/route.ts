import { apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { portfolioMutation } from "@/lib/portfolio/access";
import { createPortfolioProject, getContentPage } from "@/services/portfolio";
export async function GET(r: Request) {
  const q = Object.fromEntries(new URL(r.url).searchParams);
  return salesApi(async () =>
    apiSuccess("Content loaded", await getContentPage(q, false)),
  );
}
export async function POST(r: Request) {
  return portfolioMutation(r, async (a) =>
    apiSuccess(
      "Content created",
      await createPortfolioProject(await salesBody(r), a.id),
      201,
    ),
  );
}
