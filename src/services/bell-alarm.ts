import { cache } from "react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Product } from "@/models/product";
import { ProductCategory } from "@/models/product-category";
import { createSlug } from "@/lib/utils/slug";
import { bellAlarmSchema } from "@/lib/validations/product";
const dto = (d: any) => {
  const v = d.toObject();
  const { _id, __v, ...r } = v;
  return { ...r, id: String(_id) };
};
async function slug(name: string) {
  const b = createSlug(name) || "bell-alarm";
  let s = b,
    n = 2;
  while (await Product.exists({ slug: s })) s = `${b}-${n++}`;
  return s;
}
export async function getBellAlarmProducts(
  type: "bell-alarm-system" | "bell-alarm-accessory" = "bell-alarm-system",
  admin = false,
) {
  await connectToDatabase();
  return (
    await Product.find({
      productType: type,
      ...(admin ? {} : { status: "published" }),
    })
      .sort({ featured: -1, updatedAt: -1 })
      .limit(200)
  ).map(dto);
}
export const getBellAlarmProductBySlug = cache(
  async (slugValue: string, admin = false) => {
    await connectToDatabase();
    const d = await Product.findOne({
      slug: slugValue,
      productType: { $in: ["bell-alarm-system", "bell-alarm-accessory"] },
      ...(admin ? {} : { status: "published" }),
    });
    return d ? dto(d) : null;
  },
);
export async function getBellAlarmProductById(id: string, admin = false) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const d = await Product.findOne({
    _id: id,
    productType: { $in: ["bell-alarm-system", "bell-alarm-accessory"] },
    ...(admin ? {} : { status: "published" }),
  });
  return d ? dto(d) : null;
}
export async function createBellAlarmProduct(raw: unknown, adminId: string) {
  const input = bellAlarmSchema.parse(raw);
  await connectToDatabase();
  let category = input.category;
  if (
    !(await ProductCategory.exists({
      _id: category,
      productType: input.productType,
    }))
  )
    category =
      (
        await ProductCategory.findOne({
          productType: input.productType,
          active: true,
        })
      )?.id || "";
  if (!category) throw new Error("INVALID_CATEGORY");
  return dto(
    await Product.create({
      ...input,
      category,
      slug: await slug(input.name),
      createdBy: adminId,
      updatedBy: adminId,
    }),
  );
}
export async function updateBellAlarmProduct(
  id: string,
  raw: unknown,
  adminId: string,
) {
  const input = bellAlarmSchema.parse(raw);
  await connectToDatabase();
  const d = await Product.findOneAndUpdate(
    { _id: id, productType: input.productType },
    { $set: { ...input, updatedBy: adminId } },
    { new: true, runValidators: true },
  );
  return d ? dto(d) : null;
}
