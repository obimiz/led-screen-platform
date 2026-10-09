import { apiSuccess } from "@/lib/api/responses"; import { salesApi } from "@/lib/sales/api"; import { createInstallationQuotation } from "@/services/installations";
export async function POST(_:Request,c:{params:Promise<{id:string}>}){return salesApi(async a=>apiSuccess("Installation quotation created",await createInstallationQuotation((await c.params).id,a.id),201))}
