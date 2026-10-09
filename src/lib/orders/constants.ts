export const fulfilmentMethods = ["delivery", "pickup", "arrange-with-us"] as const;
export const orderStatuses = ["pending", "confirmed", "processing", "ready-for-pickup", "dispatched", "delivered", "completed", "cancelled"] as const;
export const paymentStatuses = ["unpaid", "pending", "paid", "partially-paid", "failed", "refunded", "cancelled"] as const;
export const paymentMethods = ["online", "bank-transfer", "cash", "pos", "pay-on-delivery", "other"] as const;
