import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { salesQuerySchema } from "@/lib/validations/sales";
import { createQuotation, getQuotations } from "@/services/sales";
export async function GET(request: NextRequest) {
  return salesApi(async () =>
    apiSuccess(
      "Quotations loaded",
      await getQuotations(
        salesQuerySchema.parse(
          Object.fromEntries(request.nextUrl.searchParams),
        ),
      ),
    ),
  );
}
export async function POST(request: Request) {
  return salesApi(async (admin) =>
    apiSuccess(
      "Quotation created",
      await createQuotation(await salesBody(request), admin.id),
      201,
    ),
  );
}
