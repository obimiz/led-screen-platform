import "server-only";
import crypto from "node:crypto";
const endpoint="https://api.paystack.co";
function key(){const value=process.env.PAYSTACK_SECRET_KEY;if(!value)throw new Error("PAYSTACK_NOT_CONFIGURED");return value;}
async function call(path:string,init:RequestInit){const response=await fetch(`${endpoint}${path}`,{...init,headers:{Authorization:`Bearer ${key()}`,"Content-Type":"application/json",...(init.headers||{})},cache:"no-store"});const data=await response.json().catch(()=>null);if(!response.ok||!data?.status)throw new Error("PAYSTACK_REQUEST_FAILED");return data.data;}
export async function initializePaystack(input:{email:string,amount:number,currency:string,reference:string,callbackUrl:string}){return call("/transaction/initialize",{method:"POST",body:JSON.stringify(input)});}
export async function verifyPaystack(reference:string){return call(`/transaction/verify/${encodeURIComponent(reference)}`,{method:"GET"});}
export function verifyPaystackSignature(body:string,signature:string){const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret||!signature)return false;const expected=crypto.createHmac("sha512",secret).update(body).digest("hex");if(expected.length!==signature.length)return false;return crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(signature));}
