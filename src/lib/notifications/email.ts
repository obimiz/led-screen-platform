import "server-only";

const EMAIL_PATTERN = /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/;

export async function sendEmail(input:{to:string;subject:string;text:string;html:string}){
  const key=process.env.RESEND_API_KEY;
  const from=process.env.EMAIL_FROM;
  if(!key||!from)return {sent:false,reason:"EMAIL_NOT_CONFIGURED"};
  if(input.to.length>254||!EMAIL_PATTERN.test(input.to)||/[\r\n]/.test(input.to)||/[\r\n]/.test(input.subject)||/[\r\n]/.test(from)){
    throw new Error("INVALID_EMAIL_INPUT");
  }
  const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:input.to,subject:input.subject,text:input.text,html:input.html}),cache:"no-store"});
  if(!r.ok)throw new Error("EMAIL_PROVIDER_FAILED");
  const d=await r.json();
  return {sent:true,providerMessageId:d.id as string|undefined};
}
