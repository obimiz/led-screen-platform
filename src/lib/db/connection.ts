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

  const selectionTimeout = Number(
    process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ?? 5000,
  );
  const timeout = Number.isFinite(selectionTimeout) && selectionTimeout > 0
    ? Math.min(selectionTimeout, 30000)
    : 5000;

  // Atlas outages should fail a request promptly instead of holding a public
  // page open for the driver's default 30-second selection window.
  cache.promise ??= mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: timeout,
    connectTimeoutMS: timeout,
  });

  try {
    cache.connection = await cache.promise;
  } catch (cause) {
    cache.promise = null;
    throw new Error("Unable to connect to the database.", { cause });
  }

  return cache.connection;
}
