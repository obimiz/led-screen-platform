import "server-only";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
export async function musicAudioBucket() {
  await connectToDatabase();
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db!, {
    bucketName: "musicAudio",
    chunkSizeBytes: 255 * 1024,
  });
}
