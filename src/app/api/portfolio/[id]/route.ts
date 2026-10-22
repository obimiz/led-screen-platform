import { apiNotFound, apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { portfolioMutation } from "@/lib/portfolio/access";
import {
  getPortfolioProjectById,
  updatePortfolioProject,
  deletePortfolioProject,
} from "@/services/portfolio";
export async function GET(_: Request, c: { params: Promise<{ id: string }> }) {
  return salesApi(async () => {
    const d = await getPortfolioProjectById((await c.params).id);
    return d ? apiSuccess("Loaded", d) : apiNotFound();
  });
}
export async function PUT(r: Request, c: { params: Promise<{ id: string }> }) {
  return portfolioMutation(r, async (a) =>
    apiSuccess(
      "Updated",
      await updatePortfolioProject(
        (await c.params).id,
        await salesBody(r),
        a.id,
      ),
    ),
  );
}
export async function DELETE(
  r: Request,
  c: { params: Promise<{ id: string }> },
) {
  return portfolioMutation(r, async () => {
    const body = (await salesBody(r)) as { confirm?: unknown };
    if (body.confirm !== true)
      return Response.json(
        { success: false, message: "Confirm permanent deletion" },
        { status: 400 },
      );
    return apiSuccess(
      "Deleted",
      await deletePortfolioProject((await c.params).id),
    );
  });
}
