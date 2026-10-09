import { apiSuccess } from "@/lib/api/responses"; import { salesApi,salesBody } from "@/lib/sales/api"; import { createSiteAssessment } from "@/services/installations";
export async function POST(r:Request){return salesApi(async a=>apiSuccess("Assessment created",await createSiteAssessment(new URL(r.url).searchParams.get("requestId")||"",await salesBody(r),a.id),201))}
