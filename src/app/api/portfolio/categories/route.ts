import { apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { portfolioMutation } from "@/lib/portfolio/access";
import {
  createPortfolioCategory,
  getPortfolioCategories,
} from "@/services/portfolio";
export async function GET(r: Request) {
  if (new URL(r.url).searchParams.get("admin") === "1")
    return salesApi(async () =>
      apiSuccess("Categories loaded", await getPortfolioCategories(true)),
    );
  return apiSuccess("Categories loaded", await getPortfolioCategories());
}
export async function POST(r: Request) {
  return portfolioMutation(r, async () =>
    apiSuccess(
      "Category created",
      await createPortfolioCategory(await salesBody(r)),
      201,
    ),
  );
}
