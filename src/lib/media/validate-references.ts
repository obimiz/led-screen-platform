import "server-only";
import { Types } from "mongoose";
import { ProductImageAsset } from "@/models/product-image";
/** Stored catalogue images remain public assets; library enumeration and writes require authentication. */
export async function validateImageReferences(urls: string[]) {
  for (const url of new Set(urls.filter(Boolean))) {
    if (!url.startsWith("/api/product-images/")) continue;
    const id = url.slice("/api/product-images/".length);
    if (
      !Types.ObjectId.isValid(id) ||
      !(await ProductImageAsset.exists({ _id: id }))
    )
      throw new Error("INVALID_IMAGE_REFERENCE");
  }
}
