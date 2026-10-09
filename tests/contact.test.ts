import test from "node:test"; import assert from "node:assert/strict"; import {normalizePhoneNumber,createWhatsAppUrl} from "../src/lib/utils/contact"; import {contactEnquirySchema} from "../src/lib/validations/contact";
test("normalizes Nigerian phone numbers",()=>assert.equal(normalizePhoneNumber("08012345678","Nigeria"),"2348012345678"));
test("preserves international WhatsApp numbers",()=>assert.equal(normalizePhoneNumber("+447911123456"),"447911123456"));
test("invalid WhatsApp number produces no link",()=>assert.equal(createWhatsAppUrl("", "Hello"),""));
test("contact requires a usable channel",()=>assert.throws(()=>contactEnquirySchema.parse({name:"Ada",subject:"Help",message:"Please contact me about a product."})));
