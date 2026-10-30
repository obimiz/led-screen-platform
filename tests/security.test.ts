import assert from "node:assert/strict";
import test from "node:test";
import { normalizeMusicSourceUrl } from "../src/lib/music/embeds";
import { normalizeGalleryVideoUrl } from "../src/lib/gallery/media";

test("media embeds only allow trusted providers", () => {
  assert.match(
    normalizeMusicSourceUrl("https://youtu.be/example") ?? "",
    /youtube-nocookie\.com/,
  );
  assert.equal(
    normalizeMusicSourceUrl("https://attacker.example/embed/x"),
    null,
  );
  assert.match(
    normalizeGalleryVideoUrl("https://vimeo.com/123") ?? "",
    /player\.vimeo\.com/,
  );
  assert.equal(normalizeGalleryVideoUrl("javascript:alert(1)"), null);
});
