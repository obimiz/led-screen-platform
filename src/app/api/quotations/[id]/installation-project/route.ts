import { apiSuccess } from "@/lib/api/responses";
import { salesApi } from "@/lib/sales/api";
import { createInstallationProjectFromQuotation } from "@/services/installations";
export async function POST(_: Request, c: { params: Promise<{ id: string }> }) {
  return salesApi(async (a) =>
    apiSuccess(
      "Installation project created",
      await createInstallationProjectFromQuotation((await c.params).id, a.id),
      201,
    ),
  );
}
