import { z } from "zod";
import { fulfilmentMethods, orderStatuses, paymentStatuses, paymentMethods } from "@/lib/orders/constants";
const text=(n:number)=>z.string().trim().max(n).default("");
export const cartItemSchema=z.object({productId:z.string().regex(/^[a-f\d]{24}$/i),quantity:z.coerce.number().int().min(1).max(100000)});
export const checkoutSchema=z.object({customerName:z.string().trim().min(2).max(160),customerEmail:z.string().trim().email().max(200),customerPhone:z.string().trim().min(5).max(40),whatsappNumber:text(40),fulfilmentMethod:z.enum(fulfilmentMethods),deliveryAddress:text(300),city:text(100),state:text(100),country:text(100),deliveryNotes:text(500),customerNote:text(1000),items:z.array(cartItemSchema).min(1).max(100),idempotencyKey:z.string().trim().min(16).max(100)}).superRefine((v,c)=>{if(v.fulfilmentMethod==="delivery"&&!v.deliveryAddress)c.addIssue({code:"custom",path:["deliveryAddress"],message:"Delivery address is required"});});
export const updateOrderStatusSchema=z.object({status:z.enum(orderStatuses),note:text(500)});
export const updatePaymentStatusSchema=z.object({paymentStatus:z.enum(paymentStatuses),paymentMethod:z.enum(paymentMethods).optional(),paymentReference:text(160),note:text(500)});
export type CheckoutValues=z.output<typeof checkoutSchema>;
