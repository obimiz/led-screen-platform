import { apiSuccess } from "@/lib/api/responses"; import { salesApi } from "@/lib/sales/api"; import { getPayments } from "@/services/payments";
export async function GET(){return salesApi(async()=>apiSuccess("Payments loaded",await getPayments()));}
