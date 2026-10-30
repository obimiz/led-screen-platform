import { readdir } from "node:fs/promises";
import path from "node:path";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ProductImageAsset } from "@/models/product-image";
import {
  MAX_IMAGE_BYTES,
  decodeProductImagePixels,
} from "@/lib/media/product-images";
import { isSameOriginUpload } from "@/lib/media/upload-origin";
export const runtime = "nodejs";
export async function GET() {
  if (!(await getCurrentAdmin()))
    return Response.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  try {
    const images: { url: string; name: string }[] = [];
    for (const directory of [
      "images/led-screens",
      "images/products/led-screens",
      "Images/products/led-screens",
    ]) {
      const entries = await readdir(
        path.join(process.cwd(), "public", directory),
        { withFileTypes: true },
      ).catch(() => []);
      for (const entry of entries)
        if (entry.isFile() && /\.(png|jpe?g|webp)$/i.test(entry.name))
          images.push({
            url: `/${directory}/${encodeURIComponent(entry.name)}`,
            name: entry.name,
          });
    }
    await connectToDatabase();
    const uploads = await ProductImageAsset.find()
      .select("name")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    images.push(
      ...uploads.map((item) => ({
        url: `/api/product-images/${item._id}`,
        name: item.name,
      })),
    );
    return Response.json(
      { images },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { message: "Unable to load images." },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  if (!(await getCurrentAdmin()))
    return Response.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  if (!isSameOriginUpload(request))
    return Response.json(
      { message: "Invalid request origin." },
      { status: 403 },
    );
  // Raw file bodies permit a strict streaming size limit before buffering.
  const mime = request.headers.get("content-type") || "";
  if (!["image/png", "image/jpeg", "image/webp"].includes(mime))
    return Response.json(
      { message: "Upload PNG, JPEG or WebP only." },
      { status: 415 },
    );
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json({ message: "Image is required." }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_IMAGE_BYTES) {
        await reader.cancel();
        return Response.json(
          { message: "Maximum image size is 4 MB." },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const data = Buffer.concat(chunks);
    try {
      // Decode pixels as well as checking signatures, rejecting truncated or oversized images.
      await decodeProductImagePixels(data, mime);
    } catch (error) {
      return Response.json(
        { message: (error as Error).message },
        { status: 400 },
      );
    }
    await connectToDatabase();
    const admin = await getCurrentAdmin();
    const image = await ProductImageAsset.create({
      data,
      contentType: mime as "image/png" | "image/jpeg" | "image/webp",
      name: (request.headers.get("x-file-name") || "Product image").slice(
        0,
        200,
      ),
      createdBy: admin!.id,
    });
    return Response.json(
      { url: `/api/product-images/${image.id}` },
      { status: 201 },
    );
  } catch {
    return Response.json(
      { message: "Unable to upload image." },
      { status: 500 },
    );
  }
}
