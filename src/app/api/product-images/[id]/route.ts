import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ProductImageAsset } from "@/models/product-image";
export const runtime = "nodejs";
// Product images are public catalogue assets; only uploads/library access require an admin.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return new Response(null, { status: 404 });
  try {
    await connectToDatabase();
    const image = await ProductImageAsset.findById(id).select("+data");
    if (!image) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(image.data), {
      headers: {
        "Content-Type": image.contentType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}
