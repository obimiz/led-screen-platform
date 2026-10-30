import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SalesCounter } from "@/models/sales-counter";
import { ContactEnquiry } from "@/models/contact-enquiry";
import {
  contactEnquirySchema,
  contactUpdateSchema,
  communicationSchema,
} from "@/lib/validations/contact";
import { emitDomainEvent } from "@/services/notifications";
async function nextRef() {
  const y = new Date().getFullYear();
  const c = await SalesCounter.findOneAndUpdate(
    { _id: `contact-${y}` },
    { $inc: { value: 1 } },
    { upsert: true, new: true },
  );
  return `CE-${y}-${String(c.value).padStart(5, "0")}`;
}
function dto(d: any, publicView = false) {
  const x = d.toObject ? d.toObject() : d;
  return publicView
    ? {
        referenceNumber: x.referenceNumber,
        message: "Your enquiry has been received.",
      }
    : {
        ...x,
        id: String(x._id),
        assignedTo: x.assignedTo ? String(x.assignedTo) : "",
      };
}
export async function createContactEnquiry(raw: unknown) {
  const i = contactEnquirySchema.parse(raw);
  if (i.honeypot)
    return { referenceNumber: `CE-${new Date().getFullYear()}-PENDING` };
  await connectToDatabase();
  const links = [
    "productId",
    "quotationId",
    "rentalRequestId",
    "installationRequestId",
    "maintenanceRequestId",
    "bellAlarmRequestId",
    "orderId",
    "paymentId",
    "portfolioProjectId",
  ].reduce(
    (o, k) => ({
      ...o,
      [k]: Types.ObjectId.isValid((i as any)[k]) ? (i as any)[k] : null,
    }),
    {},
  );
  const d = await ContactEnquiry.create({
    ...i,
    ...links,
    referenceNumber: await nextRef(),
    status: "new",
    priority: "normal",
    statusHistory: [{ status: "new" }],
  });
  void emitDomainEvent({
    type: "contact.enquiry.created",
    payload: {
      referenceNumber: d.referenceNumber,
      entityType: "contact-enquiry",
      entityId: d.id,
      actionUrl: `/admin/enquiries/${d.id}`,
    },
  }).catch(() => {});
  return dto(d, true);
}
export async function getContactEnquiries() {
  await connectToDatabase();
  return (await ContactEnquiry.find().sort({ createdAt: -1 }).limit(300)).map(
    (d) => dto(d),
  );
}
export async function getContactEnquiryById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const d = await ContactEnquiry.findById(id);
  return d ? dto(d) : null;
}
export async function updateContactEnquiry(
  id: string,
  raw: unknown,
  adminId: string,
) {
  if (!Types.ObjectId.isValid(id)) return null;
  const i = contactUpdateSchema.parse(raw);
  await connectToDatabase();
  const d = await ContactEnquiry.findById(id);
  if (!d) return null;
  const previous = d.status;
  d.set({
    ...i,
    assignedTo: Types.ObjectId.isValid(i.assignedTo) ? i.assignedTo : null,
    updatedAt: new Date(),
  });
  if (i.status && i.status !== previous) {
    d.statusHistory.push({
      status: i.status,
      changedBy: new Types.ObjectId(adminId),
    } as any);
  }
  await d.save();
  return dto(d);
}
export async function addCommunicationLog(
  id: string,
  raw: unknown,
  adminId: string,
) {
  if (!Types.ObjectId.isValid(id)) return null;
  const i = communicationSchema.parse(raw);
  await connectToDatabase();
  const d = await ContactEnquiry.findByIdAndUpdate(
    id,
    {
      $push: { communicationHistory: { ...i, recordedBy: adminId } },
      $set: { lastContactedAt: new Date() },
    },
    { new: true },
  );
  return d ? dto(d) : null;
}
