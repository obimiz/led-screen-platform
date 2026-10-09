import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/responses";
import { salesApi } from "@/lib/sales/api";
import { getSalesCatalogue } from "@/services/sales";
export async function GET(request: NextRequest) {
  return salesApi(async () =>
    apiSuccess(
      "Catalogue loaded",
      await getSalesCatalogue(request.nextUrl.searchParams.get("search") ?? ""),
    ),
  );
}
