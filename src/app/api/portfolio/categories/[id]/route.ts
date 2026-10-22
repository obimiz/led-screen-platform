import { apiSuccess } from "@/lib/api/responses";
import { salesBody } from "@/lib/sales/api";
import { portfolioMutation } from "@/lib/portfolio/access";
import { savePortfolioCategory } from "@/services/portfolio";
export async function PUT(r: Request, c: { params: Promise<{ id: string }> }) {
  return portfolioMutation(r, async () =>
    apiSuccess(
      "Category saved",
      await savePortfolioCategory(await salesBody(r), (await c.params).id),
    ),
  );
}
