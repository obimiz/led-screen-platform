import "server-only";

import { Types } from "mongoose";
import { cache } from "react";

import { connectToDatabase } from "@/lib/db/mongoose";
import { createSlug, escapeRegExp } from "@/lib/utils/slug";
import type {
  AccessoryValues,
  ProductCategoryValues,
  ProductQuery,
  ProductValues,
} from "@/lib/validations/product";
import { Product, type ProductDocument } from "@/models/product";
import {
  ProductCategory,
  type ProductCategoryDocument,
} from "@/models/product-category";
import type {
  AccessoryListResult,
  AccessoryProduct,
  LedProduct,
  ProductCategoryDto,
  ProductListResult,
} from "@/types/product";

type CategorySummary = { id: string; name: string; slug: string };

function categoryDto(
  category: ProductCategoryDocument & { _id: Types.ObjectId },
): ProductCategoryDto {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    active: category.active,
    sortOrder: category.sortOrder,
    productType: category.productType,
  };
}

function accessoryDto(
  product: ProductDocument & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  },
  category: CategorySummary,
): AccessoryProduct {
  return {
    id: product._id.toString(),
    slug: product.slug,
    productType: "led-accessory",
    category,
    name: product.name,
    brand: product.brand,
    modelNumber: product.modelNumber,
    sku: product.sku ?? "",
    shortDescription: product.shortDescription,
    description: product.description,
    compatibility: [...product.compatibility],
    features: [...product.features],
    specifications: product.specifications.map((item) => ({
      label: item.label,
      value: item.value,
    })),
    imageUrls: [...product.imageUrls],
    featuredImageUrl: product.featuredImageUrl,
    videoUrl: product.videoUrl,
    price: product.price ?? null,
    currency: product.currency,
    priceType: product.priceType,
    stockStatus: product.stockStatus,
    quantity: product.quantity,
    isPurchasableOnline: product.isPurchasableOnline,
    minOrderQuantity: product.minOrderQuantity,
    maxOrderQuantity: product.maxOrderQuantity ?? null,
    allowBackorder: product.allowBackorder,
    trackInventory: product.trackInventory,
    lowStockThreshold: product.lowStockThreshold,
    shippingRequired: product.shippingRequired,
    orderNotes: product.orderNotes,
    isRentable: product.isRentable,
    rentalQuantityAvailable: product.rentalQuantityAvailable,
    rentalDailyRate: product.rentalDailyRate ?? null,
    rentalHourlyRate: product.rentalHourlyRate ?? null,
    minimumRentalDays: product.minimumRentalDays,
    rentalDepositAmount: product.rentalDepositAmount,
    featured: product.featured,
    status: product.status,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function productDto(
  product: ProductDocument & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  },
  category: CategorySummary,
): LedProduct {
  return {
    id: product._id.toString(),
    slug: product.slug,
    productType: "led-screen",
    category,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    indoorOutdoor: product.indoorOutdoor ?? "indoor",
    pixelPitch: product.pixelPitch,
    displayTechnology: product.displayTechnology,
    brightness: product.brightness,
    refreshRate: product.refreshRate,
    viewingAngle: product.viewingAngle,
    cabinetSize: product.cabinetSize,
    moduleSize: product.moduleSize,
    resolution: product.resolution,
    weight: product.weight,
    powerConsumption: product.powerConsumption,
    voltage: product.voltage,
    waterproofRating: product.waterproofRating,
    lifespan: product.lifespan,
    maintenanceType: product.maintenanceType,
    minimumViewingDistance: product.minimumViewingDistance,
    maximumViewingDistance: product.maximumViewingDistance,
    supportedInputs: [...product.supportedInputs],
    usageApplications: [...product.usageApplications],
    specifications: product.specifications.map((item) => ({
      label: item.label,
      value: item.value,
    })),
    features: [...product.features],
    imageUrls: [...product.imageUrls],
    featuredImageUrl: product.featuredImageUrl,
    imageFit: product.imageFit ?? "cover",
    videoUrl: product.videoUrl,
    price: product.price ?? null,
    currency: product.currency,
    priceType: product.priceType,
    stockStatus: product.stockStatus,
    quantity: product.quantity,
    isPurchasableOnline: product.isPurchasableOnline,
    minOrderQuantity: product.minOrderQuantity,
    maxOrderQuantity: product.maxOrderQuantity ?? null,
    allowBackorder: product.allowBackorder,
    trackInventory: product.trackInventory,
    lowStockThreshold: product.lowStockThreshold,
    shippingRequired: product.shippingRequired,
    orderNotes: product.orderNotes,
    isRentable: product.isRentable,
    rentalQuantityAvailable: product.rentalQuantityAvailable,
    rentalDailyRate: product.rentalDailyRate ?? null,
    rentalHourlyRate: product.rentalHourlyRate ?? null,
    minimumRentalDays: product.minimumRentalDays,
    rentalDepositAmount: product.rentalDepositAmount,
    featured: product.featured,
    status: product.status,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

async function attachCategories(
  products: Array<
    ProductDocument & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date }
  >,
) {
  const ids = [
    ...new Set(products.map((product) => product.category.toString())),
  ];
  const categories = await ProductCategory.find({ _id: { $in: ids } });
  const map = new Map(
    categories.map((category) => [
      category.id,
      { id: category.id, name: category.name, slug: category.slug },
    ]),
  );
  return products.map((product) =>
    productDto(
      product,
      map.get(product.category.toString()) ?? {
        id: product.category.toString(),
        name: "Uncategorized",
        slug: "",
      },
    ),
  );
}

export async function getProductCategories(includeInactive = false) {
  return getCategoriesByType("led-screen", includeInactive);
}

export async function getCategoriesByType(
  productType: ProductCategoryValues["productType"],
  includeInactive = false,
) {
  await connectToDatabase();
  const categories = await ProductCategory.find({
    productType,
    ...(includeInactive ? {} : { active: true }),
  }).sort({ sortOrder: 1, name: 1 });
  return categories.map(categoryDto);
}

async function uniqueCategorySlugByType(
  name: string,
  productType: ProductCategoryValues["productType"],
  excludeId?: string,
) {
  const base = createSlug(name) || "category";
  let slug = base;
  let suffix = 2;
  while (
    await ProductCategory.exists({
      productType,
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  )
    slug = `${base}-${suffix++}`;
  return slug;
}

export async function createProductCategory(input: ProductCategoryValues) {
  await connectToDatabase();
  const category = await ProductCategory.create({
    ...input,
    slug: await uniqueCategorySlugByType(input.name, input.productType),
    productType: input.productType,
  });
  return categoryDto(category);
}

export async function updateProductCategory(
  id: string,
  input: ProductCategoryValues,
) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const existing = await ProductCategory.findOne({
    _id: id,
    productType: input.productType,
  });
  if (!existing) return null;
  existing.set({
    ...input,
    slug:
      input.name === existing.name
        ? existing.slug
        : await uniqueCategorySlugByType(input.name, input.productType, id),
  });
  await existing.save();
  return categoryDto(existing);
}

async function uniqueProductSlug(name: string) {
  const base = createSlug(name) || "led-screen";
  let slug = base;
  let suffix = 2;
  while (await Product.exists({ slug })) slug = `${base}-${suffix++}`;
  return slug;
}

export async function getLedProducts(
  query: ProductQuery,
  admin = false,
): Promise<ProductListResult> {
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    productType: "led-screen",
    ...(admin ? {} : { status: "published" }),
  };
  if (query.status && admin) filter.status = query.status;
  if (query.indoorOutdoor) filter.indoorOutdoor = query.indoorOutdoor;
  if (query.stockStatus) filter.stockStatus = query.stockStatus;
  if (query.pixelPitch)
    filter.pixelPitch = {
      $regex: escapeRegExp(query.pixelPitch),
      $options: "i",
    };
  if (query.category) {
    const category = Types.ObjectId.isValid(query.category)
      ? await ProductCategory.findById(query.category).select("_id")
      : await ProductCategory.findOne({
          slug: query.category,
          productType: "led-screen",
        }).select("_id");
    filter.category = category?._id ?? new Types.ObjectId();
  }
  if (query.search) {
    const expression = { $regex: escapeRegExp(query.search), $options: "i" };
    filter.$or = [
      { name: expression },
      { shortDescription: expression },
      { pixelPitch: expression },
    ];
  }
  const total = await Product.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / query.limit));
  const page = Math.min(query.page, pages);
  const products = await Product.find(filter)
    .sort({ featured: -1, updatedAt: -1 })
    .skip((page - 1) * query.limit)
    .limit(query.limit);
  return { products: await attachCategories(products), page, pages, total };
}

export async function getLedProductById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const product = await Product.findOne({ _id: id, productType: "led-screen" });
  if (!product) return null;
  return (await attachCategories([product]))[0] ?? null;
}

export const getLedProductBySlug = cache(async (slug: string) => {
  await connectToDatabase();
  const product = await Product.findOne({
    slug,
    productType: "led-screen",
    status: "published",
  });
  if (!product) return null;
  return (await attachCategories([product]))[0] ?? null;
});

export async function getFeaturedLedProducts(limit = 6) {
  await connectToDatabase();
  const products = await Product.find({
    productType: "led-screen",
    status: "published",
    featured: true,
  })
    .sort({ updatedAt: -1 })
    .limit(limit);
  return attachCategories(products);
}

export async function createLedProduct(input: ProductValues, adminId: string) {
  await connectToDatabase();
  const category = await ProductCategory.exists({
    _id: input.category,
    productType: "led-screen",
  });
  if (!category) throw new Error("INVALID_CATEGORY");
  const product = await Product.create({
    ...input,
    slug: await uniqueProductSlug(input.name),
    productType: "led-screen",
    createdBy: adminId,
    updatedBy: adminId,
  });
  return getLedProductById(product.id);
}

export async function updateLedProduct(
  id: string,
  input: ProductValues,
  adminId: string,
) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const category = await ProductCategory.exists({
    _id: input.category,
    productType: "led-screen",
  });
  if (!category) throw new Error("INVALID_CATEGORY");
  await Product.findOneAndUpdate(
    { _id: id, productType: "led-screen" },
    { $set: { ...input, updatedBy: adminId } },
    { runValidators: true },
  );
  return getLedProductById(id);
}

export async function archiveLedProduct(id: string, adminId: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const product = await Product.findOneAndUpdate(
    { _id: id, productType: "led-screen" },
    { $set: { status: "archived", updatedBy: adminId } },
    { new: true },
  );
  if (!product) return null;
  return (await attachCategories([product]))[0] ?? null;
}

async function attachAccessoryCategories(
  products: Array<
    ProductDocument & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date }
  >,
) {
  const ids = [
    ...new Set(products.map((product) => product.category.toString())),
  ];
  const categories = await ProductCategory.find({ _id: { $in: ids } });
  const map = new Map(
    categories.map((category) => [
      category.id,
      { id: category.id, name: category.name, slug: category.slug },
    ]),
  );
  return products.map((product) =>
    accessoryDto(
      product,
      map.get(product.category.toString()) ?? {
        id: product.category.toString(),
        name: "Uncategorized",
        slug: "",
      },
    ),
  );
}

export async function getAccessories(
  query: ProductQuery,
  admin = false,
): Promise<AccessoryListResult> {
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    productType: "led-accessory",
    ...(admin ? {} : { status: "published" }),
  };
  if (query.status && admin) filter.status = query.status;
  if (query.stockStatus) filter.stockStatus = query.stockStatus;
  if (query.priceType) filter.priceType = query.priceType;
  if (query.brand)
    filter.brand = { $regex: escapeRegExp(query.brand), $options: "i" };
  if (query.category) {
    const category = Types.ObjectId.isValid(query.category)
      ? await ProductCategory.findOne({
          _id: query.category,
          productType: "led-accessory",
        }).select("_id")
      : await ProductCategory.findOne({
          slug: query.category,
          productType: "led-accessory",
        }).select("_id");
    filter.category = category?._id ?? new Types.ObjectId();
  }
  if (query.search) {
    const expression = { $regex: escapeRegExp(query.search), $options: "i" };
    filter.$or = [
      { name: expression },
      { shortDescription: expression },
      { sku: expression },
      { brand: expression },
      { modelNumber: expression },
    ];
  }
  const total = await Product.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / query.limit));
  const page = Math.min(query.page, pages);
  const products = await Product.find(filter)
    .sort({ featured: -1, updatedAt: -1 })
    .skip((page - 1) * query.limit)
    .limit(query.limit);
  return {
    products: await attachAccessoryCategories(products),
    page,
    pages,
    total,
  };
}

export async function getAccessoryById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const product = await Product.findOne({
    _id: id,
    productType: "led-accessory",
  });
  if (!product) return null;
  return (await attachAccessoryCategories([product]))[0] ?? null;
}

export const getAccessoryBySlug = cache(async (slug: string) => {
  await connectToDatabase();
  const product = await Product.findOne({
    slug,
    productType: "led-accessory",
    status: "published",
  });
  if (!product) return null;
  return (await attachAccessoryCategories([product]))[0] ?? null;
});

export async function getFeaturedAccessories(limit = 6) {
  await connectToDatabase();
  const products = await Product.find({
    productType: "led-accessory",
    status: "published",
    featured: true,
  })
    .sort({ updatedAt: -1 })
    .limit(limit);
  return attachAccessoryCategories(products);
}

export async function getRelatedAccessories(
  product: AccessoryProduct,
  limit = 4,
) {
  await connectToDatabase();
  const alternatives: Array<Record<string, unknown>> = [
    { category: product.category.id },
  ];
  if (product.brand) alternatives.push({ brand: product.brand });
  if (product.compatibility.length)
    alternatives.push({ compatibility: { $in: product.compatibility } });
  const products = await Product.find({
    _id: { $ne: product.id },
    productType: "led-accessory",
    status: "published",
    $or: alternatives,
  }).limit(limit);
  return attachAccessoryCategories(products);
}

export async function createAccessory(input: AccessoryValues, adminId: string) {
  await connectToDatabase();
  if (
    !(await ProductCategory.exists({
      _id: input.category,
      productType: "led-accessory",
    }))
  )
    throw new Error("INVALID_CATEGORY");
  const product = await Product.create({
    ...input,
    sku: input.sku || undefined,
    slug: await uniqueProductSlug(input.name),
    createdBy: adminId,
    updatedBy: adminId,
  });
  return getAccessoryById(product.id);
}

export async function updateAccessory(
  id: string,
  input: AccessoryValues,
  adminId: string,
) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  if (
    !(await ProductCategory.exists({
      _id: input.category,
      productType: "led-accessory",
    }))
  )
    throw new Error("INVALID_CATEGORY");
  const { sku, ...values } = input;
  const update = sku
    ? { $set: { ...values, sku, updatedBy: adminId } }
    : { $set: { ...values, updatedBy: adminId }, $unset: { sku: 1 } };
  await Product.findOneAndUpdate(
    { _id: id, productType: "led-accessory" },
    update,
    { runValidators: true },
  );
  return getAccessoryById(id);
}

export async function setAccessoryArchived(
  id: string,
  adminId: string,
  archived: boolean,
) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const product = await Product.findOneAndUpdate(
    { _id: id, productType: "led-accessory" },
    { $set: { status: archived ? "archived" : "draft", updatedBy: adminId } },
    { new: true },
  );
  if (!product) return null;
  return (await attachAccessoryCategories([product]))[0] ?? null;
}
