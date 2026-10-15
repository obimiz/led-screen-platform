import test from "node:test";
import assert from "node:assert/strict";
import {
  AudioValidator,
  parseAudioRange,
  audioSizeLimit,
  DEFAULT_AUDIO_MAX_BYTES,
} from "../src/lib/music/audio";
import { musicContentSchema } from "../src/lib/validations/music";
import { MusicContent } from "../src/models/music-content";
test("music language metadata does not override MongoDB text-index language", () => {
  const index = MusicContent.schema
    .indexes()
    .find(([keys]) => keys.title === "text");
  assert.equal(index?.[1].language_override, "musicTextIndexLanguage");
});
function wave() {
  const p = Buffer.alloc(48);
  p.write("RIFF");
  p.writeUInt32LE(40, 4);
  p.write("WAVEfmt ", 8);
  p.writeUInt32LE(16, 16);
  p.writeUInt16LE(1, 20);
  p.writeUInt16LE(1, 22);
  p.writeUInt32LE(8000, 24);
  p.writeUInt32LE(16000, 28);
  p.writeUInt16LE(2, 32);
  p.writeUInt16LE(16, 34);
  p.write("data", 36);
  p.writeUInt32LE(4, 40);
  return p;
}
function box(type: string, data: Buffer) {
  const h = Buffer.alloc(8);
  h.writeUInt32BE(data.length + 8);
  h.write(type, 4);
  return Buffer.concat([h, data]);
}
function m4a(handler = "soun") {
  const h = Buffer.alloc(12);
  h.write(handler, 8);
  return Buffer.concat([
    box("ftyp", Buffer.from("M4A \x00\x00\x00\x00isom")),
    box("moov", box("trak", box("mdia", box("hdlr", h)))),
    box("mdat", Buffer.from([1, 2, 3, 4])),
  ]);
}
function validate(data: Buffer, type: string) {
  const v = new AudioValidator(type);
  for (let i = 0; i < data.length; i += 3) v.push(data.subarray(i, i + 3));
  v.finish();
}
test("streaming validation accepts actual audio containers across arbitrary chunk boundaries", () => {
  validate(wave(), "audio/wav");
  validate(m4a(), "audio/mp4");
  const mp3 = Buffer.alloc(417);
  mp3.set([255, 251, 144, 0]);
  validate(mp3, "audio/mpeg");
});
test("audio validation rejects disguised HTML, wrong MIME, truncation and video containers", () => {
  for (const type of ["audio/mpeg", "audio/mp4", "audio/wav"])
    assert.throws(() =>
      validate(Buffer.from("<script>alert(1)</script>"), type),
    );
  assert.throws(() => validate(wave(), "audio/mpeg"));
  assert.throws(() => validate(wave().subarray(0, 44), "audio/wav"));
  assert.throws(() => validate(m4a("vide"), "audio/mp4"));
  assert.throws(() => validate(m4a().subarray(0, 40), "audio/mp4"));
  assert.throws(() => validate(Buffer.alloc(0), "audio/wav"));
});
test("single ranges support seeking, suffixes and clamping without accepting invalid requests", () => {
  assert.equal(parseAudioRange(null, 100), null);
  assert.deepEqual(parseAudioRange("bytes=10-19", 100), { start: 10, end: 19 });
  assert.deepEqual(parseAudioRange("bytes=90-", 100), { start: 90, end: 99 });
  assert.deepEqual(parseAudioRange("bytes=-5", 100), { start: 95, end: 99 });
  assert.deepEqual(parseAudioRange("bytes=90-999", 100), {
    start: 90,
    end: 99,
  });
  for (const r of [
    "bytes=100-",
    "bytes=9-1",
    "bytes=-0",
    "bytes=0-1,4-5",
    "items=0-1",
    "bytes=99999999999999999999-",
  ])
    assert.throws(() => parseAudioRange(r, 100));
});
test("upload limits are configurable and bounded", () => {
  assert.equal(audioSizeLimit("1048576"), 1048576);
  for (const value of ["0", "-1", "no", "9999999999"])
    assert.equal(audioSizeLimit(value), DEFAULT_AUDIO_MAX_BYTES);
});
test("drafts may precede rights clearance; publishing owned music needs audio, artist and rights", () => {
  const draft = {
    title: "Synthetic recording",
    sourcePlatform: "owned" as const,
  };
  assert.equal(musicContentSchema.parse(draft).status, "draft");
  assert.throws(() =>
    musicContentSchema.parse({ ...draft, status: "published" }),
  );
  const published = {
    ...draft,
    artistName: "Test choir",
    audioAssetId: "012345678901234567890123",
    status: "published",
    contentRights: "client-owned",
    rightsConfirmed: true,
  };
  assert.equal(musicContentSchema.parse(published).rightsConfirmed, true);
  assert.throws(() =>
    musicContentSchema.parse({ ...published, rightsConfirmed: false }),
  );
  assert.throws(() =>
    musicContentSchema.parse({ ...published, releaseYear: 12 }),
  );
});
