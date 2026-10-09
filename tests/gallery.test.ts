import test from "node:test";
import assert from "node:assert/strict";
import { normalizeGalleryVideoUrl } from "../src/lib/gallery/media";
import { galleryItemSchema, testimonialSchema } from "../src/lib/validations/gallery";

test("normalizes YouTube URLs to a safe embed", () => {
  assert.equal(normalizeGalleryVideoUrl("https://youtu.be/abc123"), "https://www.youtube-nocookie.com/embed/abc123");
});

test("rejects unsafe video URLs", () => {
  assert.equal(normalizeGalleryVideoUrl("javascript:alert(1)"), null);
});

test("image gallery items require media", () => {
  assert.throws(() => galleryItemSchema.parse({ title: "A project", mediaType: "image" }));
});

test("testimonials can be drafted before consent", () => {
  const value = testimonialSchema.parse({ customerDisplayName: "School Administrator", quote: "Excellent support and a clear installation." });
  assert.equal(value.consentConfirmed, false);
});
