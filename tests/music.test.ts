import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMusicSourceUrl } from "@/lib/music/embeds";
import { musicContentSchema } from "@/lib/validations/music";
test("normalizes supported YouTube URLs", () =>
  assert.equal(
    normalizeMusicSourceUrl("https://youtu.be/abc123"),
    "https://www.youtube-nocookie.com/embed/abc123",
  ));
test("rejects unsafe embed sources", () =>
  assert.equal(normalizeMusicSourceUrl("javascript:alert(1)"), null));
test("owned audio requires rights confirmation", () =>
  assert.throws(() =>
    musicContentSchema.parse({
      title: "Test",
      sourcePlatform: "owned",
      status: "published",
      audioUrl: "https://example.com/a.mp3",
    }),
  ));
test("external content can use official source", () => {
  const v = musicContentSchema.parse({
    title: "Test",
    sourcePlatform: "youtube",
    sourceUrl: "https://youtube.com/watch?v=abc",
  });
  assert.equal(v.sourcePlatform, "youtube");
});
