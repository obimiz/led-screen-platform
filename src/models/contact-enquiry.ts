import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
const history = new Schema(
  {
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { _id: false },
);
const comm = new Schema(
  {
    method: String,
    direction: String,
    note: String,
    recordedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);
const schema = new Schema(
  {
    referenceNumber: { type: String, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, default: "", index: true },
    phone: { type: String, default: "", index: true },
    whatsappNumber: { type: String, default: "" },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    enquiryType: { type: String, index: true },
    preferredContactMethod: { type: String },
    source: { type: String },
    sourcePage: { type: String },
    productId: { type: Schema.Types.ObjectId, default: null },
    quotationId: { type: Schema.Types.ObjectId, default: null },
    rentalRequestId: { type: Schema.Types.ObjectId, default: null },
    installationRequestId: { type: Schema.Types.ObjectId, default: null },
    maintenanceRequestId: { type: Schema.Types.ObjectId, default: null },
    bellAlarmRequestId: { type: Schema.Types.ObjectId, default: null },
    orderId: { type: Schema.Types.ObjectId, default: null },
    paymentId: { type: Schema.Types.ObjectId, default: null },
    portfolioProjectId: { type: Schema.Types.ObjectId, default: null },
    status: { type: String, default: "new", index: true },
    priority: { type: String, default: "normal", index: true },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
      index: true,
    },
    adminNotes: { type: String, default: "" },
    lastContactedAt: { type: Date, default: null },
    statusHistory: { type: [history], default: [] },
    communicationHistory: { type: [comm], default: [] },
  },
  { timestamps: true },
);
schema.index({ createdAt: -1 });
export type ContactEnquiryDocument = InferSchemaType<typeof schema>;
export const ContactEnquiry =
  (models.ContactEnquiry as Model<ContactEnquiryDocument> | undefined) ??
  model<ContactEnquiryDocument>("ContactEnquiry", schema);
