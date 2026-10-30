import { z } from "zod";
export const initializePaymentSchema = z.object({
  orderPublicToken: z.string().regex(/^[a-f0-9]{64}$/i),
});
export const verifyPaymentSchema = z.object({
  reference: z.string().trim().min(8).max(120),
});
