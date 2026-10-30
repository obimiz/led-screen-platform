import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
  MAX_IMAGE_BYTES,
  decodeProductImagePixels,
  validateProductImage,
} from "../src/lib/media/product-images";
test("upload validation accepts PNG/JPEG/WebP signatures and rejects mismatched or active content", () => {
  const png = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png);
  validateProductImage(png, "image/png");
  validateProductImage(Buffer.from([255, 216, 255, 217]), "image/jpeg");
  validateProductImage(Buffer.from("RIFF0000WEBP0000"), "image/webp");
  for (const mime of ["image/jpeg", "image/svg+xml", "text/html"])
    assert.throws(() => validateProductImage(png, mime));
  assert.throws(() =>
    validateProductImage(Buffer.from("<script>alert(1)</script>"), "image/png"),
  );
  assert.throws(() => validateProductImage(Buffer.alloc(0), "image/png"));
  assert.throws(() =>
    validateProductImage(Buffer.alloc(MAX_IMAGE_BYTES + 1), "image/png"),
  );
});

test("upload origin accepts HTTPS reverse proxies and rejects other sites", async () => {
  const { isSameOriginUpload } = await import("../src/lib/media/upload-origin");
  const headers = {
    host: "internal:3000",
    "x-forwarded-host": "shop.example.test",
    "x-forwarded-proto": "https",
    origin: "https://shop.example.test",
  };
  assert.equal(
    isSameOriginUpload(
      new Request("http://internal:3000/api/product-images", { headers }),
    ),
    true,
  );
  assert.equal(
    isSameOriginUpload(
      new Request("http://internal:3000/api/product-images", {
        headers: { ...headers, origin: "https://untrusted.test" },
      }),
    ),
    false,
  );
  assert.equal(
    isSameOriginUpload(
      new Request("http://localhost:3000/api/product-images", {
        headers: { origin: "http://localhost:3000" },
      }),
    ),
    true,
  );
});

test("product display uses additional images when no featured image is selected and deduplicates thumbnails", async () => {
  const { getProductDisplayImages } =
    await import("../src/lib/media/product-primary-image");
  assert.deepEqual(
    getProductDisplayImages({
      featuredImageUrl: "",
      imageUrls: ["/api/product-images/first", "/second.png"],
    }),
    ["/api/product-images/first", "/second.png"],
  );
  assert.deepEqual(
    getProductDisplayImages({
      featuredImageUrl: "/second.png",
      imageUrls: ["/first.png", "/second.png"],
    }),
    ["/second.png", "/first.png"],
  );
  assert.deepEqual(getProductDisplayImages({}), []);
});

test("Sharp pixel validation accepts valid images and rejects corrupt or truncated pixel streams with low memory", async () => {
  const validPng = await sharp({
    create: {
      width: 64,
      height: 48,
      channels: 4,
      background: { r: 20, g: 60, b: 120, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
  await decodeProductImagePixels(validPng, "image/png");

  const corruptHeaderOnly = Buffer.from([
    137,
    80,
    78,
    71,
    13,
    10,
    26,
    10,
    ...Array(24).fill(0),
  ]);
  await assert.rejects(() =>
    decodeProductImagePixels(corruptHeaderOnly, "image/png"),
  );

  const truncatedMidStream = validPng.subarray(
    0,
    Math.floor(validPng.length / 2),
  );
  await assert.rejects(() =>
    decodeProductImagePixels(truncatedMidStream, "image/png"),
  );
});
