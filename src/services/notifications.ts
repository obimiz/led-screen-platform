import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Admin } from "@/models/admin";
import { Notification } from "@/models/notification";
import { SalesCounter } from "@/models/sales-counter";
import { sendEmail } from "@/lib/notifications/email";
import type { DomainEvent } from "@/lib/notifications/events";
async function ref() {
  const y = new Date().getFullYear();
  const c = await SalesCounter.findOneAndUpdate(
    { _id: `notifications-${y}` },
    { $inc: { value: 1 } },
    { upsert: true, new: true },
  );
  return `NTF-${y}-${String(c.value).padStart(5, "0")}`;
}
function dto(x: any) {
  return {
    ...x.toObject(),
    id: String(x._id),
    recipientAdminId: x.recipientAdminId ? String(x.recipientAdminId) : "",
  };
}
export async function createNotification(input: any) {
  await connectToDatabase();
  if (input.dedupeKey) {
    const existing = await Notification.findOne({
      dedupeKey: input.dedupeKey,
      channel: input.channel,
    });
    if (existing) return dto(existing);
  }
  const n = await Notification.create({
    ...input,
    referenceNumber: await ref(),
  });
  return dto(n);
}
export async function emitDomainEvent(event: DomainEvent) {
  await connectToDatabase();
  const admins = await Admin.find({ isActive: true })
    .select("_id email name")
    .lean();
  let title = "Notification",
    message = "A business event occurred.",
    type = "system",
    priority = "normal";
  if (event.type === "contact.enquiry.created") {
    title = "New contact enquiry";
    message = `New contact enquiry ${event.payload.referenceNumber || ""} received.`;
    type = "enquiry";
    priority = "normal";
  }
  if (event.type === "order.created") {
    title = "New order received";
    message = `New order ${event.payload.orderNumber || ""} received.`;
    type = "order";
  }
  if (event.type === "payment.successful") {
    title = "Payment confirmed";
    message = `Payment confirmed for order ${event.payload.orderNumber || ""}.`;
    type = "payment";
    priority = "high";
  }
  if (event.type === "payment.failed") {
    title = "Payment failed";
    message = `Payment requires review for order ${event.payload.orderNumber || ""}.`;
    type = "payment";
    priority = "high";
  }
  const created = [];
  for (const admin of admins) {
    created.push(
      await createNotification({
        type,
        eventType: event.type,
        title,
        message,
        audience: "admin",
        recipientAdminId: admin._id,
        recipientEmail: admin.email,
        recipientName: admin.name,
        relatedEntityType: String(event.payload.entityType || ""),
        relatedEntityId: String(event.payload.entityId || ""),
        relatedReference: String(
          event.payload.referenceNumber || event.payload.orderNumber || "",
        ),
        actionUrl: String(event.payload.actionUrl || "/admin/notifications"),
        channel: "in-app",
        status: "sent",
        priority,
        dedupeKey: `${event.type}:${event.payload.entityId || event.payload.referenceNumber || "global"}:${admin._id}`,
      }),
    );
    if (admin.email) {
      const email = await createNotification({
        type,
        eventType: event.type,
        title,
        message,
        audience: "admin",
        recipientAdminId: admin._id,
        recipientEmail: admin.email,
        recipientName: admin.name,
        relatedReference: String(
          event.payload.referenceNumber || event.payload.orderNumber || "",
        ),
        channel: "email",
        status: "pending",
        priority,
        dedupeKey: `email:${event.type}:${event.payload.entityId || event.payload.referenceNumber || "global"}:${admin._id}`,
      });
      try {
        const sent = await sendEmail({
          to: admin.email,
          subject: title,
          text: message,
          html: `<p>${message}</p>`,
        });
        email.status = sent.sent ? "sent" : "skipped";
        if (sent.sent) email.sentAt = new Date();
        else email.failureReason = sent.reason;
        await Notification.updateOne(
          { _id: email.id },
          {
            status: email.status,
            sentAt: email.sentAt,
            failureReason: email.failureReason,
          },
        );
      } catch (e) {
        await Notification.updateOne(
          { _id: email.id },
          {
            status: "failed",
            failedAt: new Date(),
            failureReason: e instanceof Error ? e.message : "Email failed",
          },
        );
      }
    }
  }
  return created;
}
export async function getAdminNotifications(adminId: string) {
  await connectToDatabase();
  return (
    await Notification.find({
      audience: "admin",
      $or: [{ recipientAdminId: adminId }, { recipientAdminId: null }],
    })
      .sort({ createdAt: -1 })
      .limit(100)
  ).map(dto);
}
export async function getUnreadNotificationCount(adminId: string) {
  await connectToDatabase();
  return Notification.countDocuments({
    audience: "admin",
    isRead: false,
    $or: [{ recipientAdminId: adminId }, { recipientAdminId: null }],
  });
}
export async function markNotificationRead(
  id: string,
  adminId: string,
  read = true,
) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const n = await Notification.findOneAndUpdate(
    {
      _id: id,
      audience: "admin",
      $or: [{ recipientAdminId: adminId }, { recipientAdminId: null }],
    },
    { $set: { isRead: read, readAt: read ? new Date() : null } },
    { new: true },
  );
  return n ? dto(n) : null;
}
export async function markAllNotificationsRead(adminId: string) {
  await connectToDatabase();
  return Notification.updateMany(
    {
      audience: "admin",
      isRead: false,
      $or: [{ recipientAdminId: adminId }, { recipientAdminId: null }],
    },
    { $set: { isRead: true, readAt: new Date() } },
  );
}
