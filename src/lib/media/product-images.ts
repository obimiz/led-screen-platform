import sharp from "sharp";

// Keep native libvips memory bounded for 512 MB container environments (e.g. Render Free).
sharp.cache(false);
sharp.concurrency(1);

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 40_000_000;
export function validateProductImage(bytes: Uint8Array, mime: string) {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES)
    throw new Error("Images must be between 1 byte and 4 MB.");
  const png =
    bytes.length >= 24 &&
    Buffer.from(bytes.subarray(0, 8)).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  const jpeg =
    bytes.length >= 4 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255;
  const webp =
    bytes.length >= 16 &&
    Buffer.from(bytes.subarray(0, 4)).toString() === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString() === "WEBP";
  if (!(
    (mime === "image/png" && png) ||
    (mime === "image/jpeg" && jpeg) ||
    (mime === "image/webp" && webp)
  ))
    throw new Error("Upload a valid PNG, JPEG or WebP image.");
}

export async function decodeProductImagePixels(
  bytes: Uint8Array,
  mime: string,
) {
  validateProductImage(bytes, mime);
  // Stream-decode all pixel scanlines through libvips stats without allocating
  // an uncompressed multi-megabyte raw pixel Buffer in V8 heap.
  await sharp(bytes, {
    limitInputPixels: MAX_IMAGE_PIXELS,
    failOn: "warning",
    sequentialRead: true,
  }).stats();
}
