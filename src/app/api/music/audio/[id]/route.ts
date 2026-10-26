import mongoose from "mongoose";
import { Readable } from "node:stream";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { MusicContent } from "@/models/music-content";
import { musicAudioBucket } from "@/lib/music/storage";
import { parseAudioRange } from "@/lib/music/audio";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function serve(
  request: Request,
  context: { params: Promise<{ id: string }> },
  head = false,
) {
  const { id } = await context.params;
  if (!/^[a-f\d]{24}$/i.test(id)) return new Response(null, { status: 404 });
  try {
    const bucket = await musicAudioBucket(),
      oid = new mongoose.mongo.ObjectId(id);
    const file = await bucket.find({ _id: oid, "metadata.ready": true }).next();
    if (!file) return new Response(null, { status: 404 });
    const publicTrack = await MusicContent.exists({
      audioAssetId: oid,
      status: "published",
      sourcePlatform: "owned",
      rightsConfirmed: true,
      contentRights: { $in: ["client-owned", "licensed"] },
    });
    const download = new URL(request.url).searchParams.get("download") === "1";
    if (
      download &&
      !(await MusicContent.exists({
        audioAssetId: oid,
        status: "published",
        sourcePlatform: "owned",
        rightsConfirmed: true,
        contentRights: { $in: ["client-owned", "licensed"] },
        permissionToDistribute: true,
      }))
    )
      return new Response(null, {
        status: 404,
        headers: { "Cache-Control": "private, no-store" },
      });
    if (!publicTrack && !(await getCurrentAdmin()))
      return new Response(null, {
        status: 404,
        headers: { "Cache-Control": "private, no-store" },
      });
    const headers = new Headers({
      "Content-Type": String(file.metadata?.contentType),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      ETag: `"${id}"`,
    });
    if (download) {
      const filename =
        String(file.filename || "audio")
          .replace(/[^a-zA-Z0-9_. -]/g, "_")
          .slice(0, 160) || "audio";
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    }
    let range;
    try {
      const ifRange = request.headers.get("if-range");
      range = parseAudioRange(
        ifRange && ifRange !== `"${id}"` ? null : request.headers.get("range"),
        file.length,
      );
    } catch {
      headers.set("Content-Range", `bytes */${file.length}`);
      return new Response(null, { status: 416, headers });
    }
    const start = range?.start || 0,
      end = range?.end ?? file.length - 1;
    headers.set("Content-Length", String(end - start + 1));
    if (range)
      headers.set("Content-Range", `bytes ${start}-${end}/${file.length}`);
    if (head) return new Response(null, { status: range ? 206 : 200, headers });
    const stream = bucket.openDownloadStream(oid, { start, end: end + 1 });
    return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, {
      status: range ? 206 : 200,
      headers,
    });
  } catch {
    return new Response(null, {
      status: 500,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}
export async function GET(r: Request, c: { params: Promise<{ id: string }> }) {
  return serve(r, c);
}
export async function HEAD(r: Request, c: { params: Promise<{ id: string }> }) {
  return serve(r, c, true);
}
