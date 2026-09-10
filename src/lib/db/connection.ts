import mongoose, { type Mongoose } from "mongoose";

type MongooseCache = {
  connection: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache = globalForMongoose.mongooseCache ?? {
  connection: null,
  promise: null,
};

globalForMongoose.mongooseCache = cache;

export async function connectToDatabase(): Promise<Mongoose> {
  if (cache.connection) return cache.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not configured. Add it to your server environment.",
    );
  }

  cache.promise ??= mongoose.connect(uri, { bufferCommands: false });

  try {
    cache.connection = await cache.promise;
  } catch (cause) {
    cache.promise = null;
    throw new Error("Unable to connect to the database.", { cause });
  }

  return cache.connection;
}
