import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createHash } from "node:crypto";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { isSameOriginUpload } from "@/lib/media/upload-origin";
import { musicAudioBucket } from "@/lib/music/storage";
import {
  AudioValidator,
  AudioValidationError,
  audioSizeLimit,
  canonicalAudioType,
} from "@/lib/music/audio";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin)
    return Response.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  const bucket = await musicAudioBucket();
  const files = await bucket
    .find({ "metadata.ready": true })
    .sort({ uploadDate: -1 })
    .limit(100)
    .toArray();
  return Response.json(
    {
      maxBytes: audioSizeLimit(),
      files: files.map((f) => ({
        id: String(f._id),
        name: f.filename,
        size: f.length,
        contentType: f.metadata?.contentType,
        url: `/api/music/audio/${f._id}`,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin || !["owner", "admin"].includes(admin.role))
    return Response.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  if (!isSameOriginUpload(request))
    return Response.json(
      { message: "Invalid request origin" },
      { status: 403 },
    );
  const type = canonicalAudioType(request.headers.get("content-type") || "");
  if (!type)
    return Response.json(
      { message: "Upload MP3, M4A or WAV audio only." },
      { status: 415 },
    );
  const limit = audioSizeLimit();
  if (Number(request.headers.get("content-length")) > limit)
    return Response.json(
      {
        message: `Maximum audio size is ${Math.floor(limit / 1024 / 1024)} MB.`,
      },
      { status: 413 },
    );
  if (!request.body)
    return Response.json({ message: "Audio is required" }, { status: 400 });
  const bucket = await musicAudioBucket();
  let name = "Audio recording";
  try {
    name = decodeURIComponent(request.headers.get("x-file-name") || name)
      .replace(/[\x00-\x1f\x7f/\\]/g, "_")
      .slice(0, 180);
  } catch {
    return Response.json({ message: "Invalid file name" }, { status: 400 });
  }
  const upload = bucket.openUploadStream(name, {
    metadata: { contentType: type, createdBy: admin.id, ready: true },
  });
  const validator = new AudioValidator(type),
    hash = createHash("sha256");
  let bytes = 0,
    oversized = false;
  const reader = request.body.getReader();
  const source = Readable.from(
    (async function* () {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield Buffer.from(value);
        }
      } finally {
        await reader.cancel().catch(() => {});
      }
    })(),
  );
  const validation = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      try {
        bytes += chunk.length;
        if (bytes > limit) {
          oversized = true;
          throw new AudioValidationError(
            `Maximum audio size is ${Math.floor(limit / 1024 / 1024)} MB.`,
          );
        }
        validator.push(chunk);
        hash.update(chunk);
        callback(null, chunk);
      } catch (e) {
        callback(e as Error);
      }
    },
    flush(callback) {
      try {
        validator.finish();
        callback();
      } catch (e) {
        callback(e as Error);
      }
    },
  });
  try {
    await pipeline(source, validation, upload);
    return Response.json(
      {
        id: String(upload.id),
        url: `/api/music/audio/${upload.id}`,
        name,
        contentType: type,
        size: bytes,
        sha256: hash.digest("hex"),
      },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    await upload.abort().catch(() => {});
    await bucket.delete(upload.id).catch(() => {});
    return Response.json(
      {
        message:
          error instanceof AudioValidationError
            ? error.message
            : "Unable to upload audio. Please try again.",
      },
      {
        status: oversized
          ? 413
          : error instanceof AudioValidationError
            ? 400
            : 500,
      },
    );
  }
}
