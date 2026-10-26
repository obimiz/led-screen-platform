import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import {
  indoorOutdoorOptions,
  maintenanceTypes,
  priceTypes,
  productStatuses,
  stockStatuses,
  productTypes,
} from "@/lib/constants/products";

const specificationSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false },
);
const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, index: true },
    productType: {
      type: String,
      required: true,
      enum: productTypes,
      default: "led-screen",
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "ProductCategory",
      required: true,
      index: true,
    },
    shortDescription: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    indoorOutdoor: {
      type: String,
      enum: indoorOutdoorOptions,
      required: function (this: { productType?: string }): boolean {
        return this.productType === "led-screen";
      },
      index: true,
    },
    pixelPitch: { type: String, trim: true, default: "", index: true },
    brand: { type: String, trim: true, default: "", index: true },
    modelNumber: { type: String, trim: true, default: "", index: true },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      set: (value: string | null | undefined) => value?.trim() || undefined,
    },
    compatibility: [{ type: String, trim: true }],
    displayTechnology: { type: String, trim: true, default: "" },
    brightness: { type: String, trim: true, default: "" },
    refreshRate: { type: String, trim: true, default: "" },
    viewingAngle: { type: String, trim: true, default: "" },
    cabinetSize: { type: String, trim: true, default: "" },
    moduleSize: { type: String, trim: true, default: "" },
    resolution: { type: String, trim: true, default: "" },
    weight: { type: String, trim: true, default: "" },
    powerConsumption: { type: String, trim: true, default: "" },
    voltage: { type: String, trim: true, default: "" },
    waterproofRating: { type: String, trim: true, default: "" },
    lifespan: { type: String, trim: true, default: "" },
    maintenanceType: {
      type: String,
      enum: maintenanceTypes,
      default: "not-specified",
    },
    minimumViewingDistance: { type: String, trim: true, default: "" },
    maximumViewingDistance: { type: String, trim: true, default: "" },
    supportedInputs: [{ type: String, trim: true }],
    usageApplications: [{ type: String, trim: true }],
    specifications: { type: [specificationSchema], default: [] },
    features: [{ type: String, trim: true }],
    imageUrls: [{ type: String, trim: true }],
    featuredImageUrl: { type: String, trim: true, default: "" },
    imageFit: { type: String, enum: ["cover", "contain"], default: "cover" },
    videoUrl: { type: String, trim: true, default: "" },
    imageAlt: { type: String, default: "", maxlength: 300 },
    imageAlts: { type: [String], default: [] },
    promotionalPrice: { type: Number, min: 0, default: null },
    showcase: {
      type: String,
      enum: ["accessory", "camera", "video"],
      default: "accessory",
    },
    price: { type: Number, min: 0, default: null },
    currency: { type: String, trim: true, uppercase: true, default: "NGN" },
    priceType: { type: String, enum: priceTypes, required: true },
    stockStatus: {
      type: String,
      enum: stockStatuses,
      required: true,
      index: true,
    },
    quantity: { type: Number, min: 0, default: 0 },
    isPurchasableOnline: { type: Boolean, default: false, index: true },
    minOrderQuantity: { type: Number, min: 1, default: 1 },
    maxOrderQuantity: { type: Number, min: 1, default: null },
    allowBackorder: { type: Boolean, default: false },
    trackInventory: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, min: 0, default: 1 },
    shippingRequired: { type: Boolean, default: true },
    orderNotes: { type: String, trim: true, default: "" },
    isRentable: { type: Boolean, default: false, index: true },
    rentalQuantityAvailable: { type: Number, min: 0, default: 0 },
    rentalDailyRate: { type: Number, min: 0, default: null },
    rentalHourlyRate: { type: Number, min: 0, default: null },
    minimumRentalDays: { type: Number, min: 1, default: 1 },
    rentalDepositAmount: { type: Number, min: 0, default: 0 },
    bellSystemType: { type: String, trim: true, default: "" },
    applicationType: { type: String, trim: true, default: "" },
    operatingMode: { type: String, trim: true, default: "" },
    programmable: { type: Boolean, default: false },
    numberOfSchedules: { type: Number, min: 0, default: 0 },
    outputZones: { type: Number, min: 0, default: 0 },
    audioOutput: { type: String, trim: true, default: "" },
    speakerSupport: { type: Boolean, default: false },
    sirenSupport: { type: Boolean, default: false },
    amplifierRequired: { type: Boolean, default: false },
    timerIncluded: { type: Boolean, default: false },
    controllerIncluded: { type: Boolean, default: false },
    batteryBackupSupported: { type: Boolean, default: false },
    remoteControlSupported: { type: Boolean, default: false },
    networkSupported: { type: Boolean, default: false },
    wifiSupported: { type: Boolean, default: false },
    gsmSupported: { type: Boolean, default: false },
    powerRequirement: { type: String, trim: true, default: "" },
    coverageDescription: { type: String, trim: true, default: "" },
    installationRequired: { type: Boolean, default: false },
    recommendedFor: [{ type: String, trim: true }],
    includedComponents: [{ type: String, trim: true }],
    optionalComponents: [{ type: String, trim: true }],
    featured: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: productStatuses,
      default: "draft",
      index: true,
    },
    seoTitle: { type: String, trim: true, default: "" },
    seoDescription: { type: String, trim: true, default: "" },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      select: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      select: false,
    },
  },
  { timestamps: true },
);
productSchema.index({ productType: 1, status: 1, updatedAt: -1 });
productSchema.index(
  { sku: 1 },
  { unique: true, sparse: true, collation: { locale: "en", strength: 2 } },
);
productSchema.index({
  name: "text",
  shortDescription: "text",
  pixelPitch: "text",
});
export type ProductDocument = InferSchemaType<typeof productSchema>;
const cachedProduct = models.Product as Model<ProductDocument> | undefined;
const cachedShowcase = cachedProduct?.schema.path("showcase") as
  (Schema.Types.String & { enumValues: string[] }) | undefined;
if (cachedShowcase && !cachedShowcase.enumValues.includes("video"))
  cachedShowcase.enum("video");
export const Product =
  cachedProduct ?? model<ProductDocument>("Product", productSchema);
