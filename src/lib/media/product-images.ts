export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
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
