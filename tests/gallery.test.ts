import test from "node:test";
import assert from "node:assert/strict";
import { normalizeGalleryVideoUrl } from "../src/lib/gallery/media";
import {
  galleryItemSchema,
  testimonialSchema,
} from "../src/lib/validations/gallery";

test("normalizes YouTube URLs to a safe embed", () => {
  assert.equal(
    normalizeGalleryVideoUrl("https://youtu.be/abc123"),
    "https://www.youtube-nocookie.com/embed/abc123",
  );
});

test("rejects unsafe video URLs", () => {
  assert.equal(normalizeGalleryVideoUrl("javascript:alert(1)"), null);
});

test("image gallery items require media", () => {
  assert.throws(() =>
    galleryItemSchema.parse({ title: "A project", mediaType: "image" }),
  );
});

test("testimonials can be drafted before consent", () => {
  const value = testimonialSchema.parse({
    customerDisplayName: "School Administrator",
    quote: "Excellent support and a clear installation.",
  });
  assert.equal(value.consentConfirmed, false);
});

test("gallery accepts existing MongoDB and static image-serving paths", () => {
  for (const imageUrl of [
    "/api/product-images/012345678901234567890123",
    "/Images/products/display.png",
    "https://example.test/image.png",
  ]) {
    assert.equal(
      galleryItemSchema.parse({
        title: "Product showcase",
        mediaType: "image",
        imageUrl,
      }).imageUrl,
      imageUrl,
    );
  }
});
test("gallery rejects executable and protocol-relative image URLs", () => {
  for (const imageUrl of [
    "javascript:alert(1)",
    "//evil.test/image.png",
    "data:image/png;base64,abc",
  ]) {
    assert.throws(() =>
      galleryItemSchema.parse({ title: "Image", mediaType: "image", imageUrl }),
    );
  }
});
test("gallery validates publication states and display order", () => {
  for (const status of ["draft", "published", "archived"])
    assert.equal(
      galleryItemSchema.parse({
        title: "Image",
        mediaType: "image",
        imageUrl: "/test.png",
        status,
      }).status,
      status,
    );
  assert.throws(() =>
    galleryItemSchema.parse({
      title: "Image",
      mediaType: "image",
      imageUrl: "/test.png",
      sortOrder: -1,
    }),
  );
});
