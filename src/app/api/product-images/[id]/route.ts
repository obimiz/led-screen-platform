import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ProductImageAsset } from "@/models/product-image";
export const runtime = "nodejs";

type CachedImageEntry = {
  bytes: Uint8Array;
  contentType: string;
};

const MAX_MEMORY_CACHE_ENTRIES = 24;
const MAX_MEMORY_CACHE_BYTES = 32 * 1024 * 1024;
const memoryCache = new Map<string, CachedImageEntry>();
let memoryCacheBytes = 0;

function getCachedImage(id: string): CachedImageEntry | undefined {
  const entry = memoryCache.get(id);
  if (!entry) return undefined;
  memoryCache.delete(id);
  memoryCache.set(id, entry);
  return entry;
}

function setCachedImage(id: string, entry: CachedImageEntry): void {
  if (entry.bytes.byteLength > MAX_MEMORY_CACHE_BYTES) return;
  const existing = memoryCache.get(id);
  if (existing) {
    memoryCacheBytes -= existing.bytes.byteLength;
    memoryCache.delete(id);
  }
  while (
    memoryCache.size >= MAX_MEMORY_CACHE_ENTRIES ||
    memoryCacheBytes + entry.bytes.byteLength > MAX_MEMORY_CACHE_BYTES
  ) {
    const oldestKey = memoryCache.keys().next().value;
    if (!oldestKey) break;
    const oldest = memoryCache.get(oldestKey);
    if (oldest) memoryCacheBytes -= oldest.bytes.byteLength;
    memoryCache.delete(oldestKey);
  }
  memoryCache.set(id, entry);
  memoryCacheBytes += entry.bytes.byteLength;
}

// Product images are public catalogue assets; only uploads/library access require an admin.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return new Response(null, { status: 404 });
  const etag = `"${id}"`;
  const commonHeaders = {
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "public, max-age=31536000, immutable",
  };
  try {
    const ifNoneMatch = request.headers.get("if-none-match");
    const cached = getCachedImage(id);
    if (ifNoneMatch && (ifNoneMatch.includes(etag) || ifNoneMatch === "*")) {
      if (cached) {
        return new Response(null, { status: 304, headers: commonHeaders });
      }
      await connectToDatabase();
      const exists = await ProductImageAsset.exists({ _id: id });
      if (!exists) return new Response(null, { status: 404 });
      return new Response(null, { status: 304, headers: commonHeaders });
    }
    if (cached) {
      return new Response(new Uint8Array(cached.bytes), {
        headers: {
          ...commonHeaders,
          "Content-Type": cached.contentType,
          "Content-Length": String(cached.bytes.byteLength),
        },
      });
    }
    await connectToDatabase();
    const image = await ProductImageAsset.findById(id)
      .select("+data contentType")
      .lean();
    if (!image?.data) return new Response(null, { status: 404 });
    const rawBuffer = Buffer.isBuffer(image.data)
      ? image.data
      : Buffer.from(
          (image.data as unknown as { buffer: ArrayBuffer }).buffer,
        );
    const bytes = new Uint8Array(rawBuffer);
    setCachedImage(id, { bytes, contentType: image.contentType });
    return new Response(new Uint8Array(bytes), {
      headers: {
        ...commonHeaders,
        "Content-Type": image.contentType,
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}

