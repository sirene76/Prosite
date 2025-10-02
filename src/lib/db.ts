import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const cached: MongooseCache =
  (global as typeof globalThis & { _mongoose?: MongooseCache })._mongoose || {
    conn: null,
    promise: null,
  };

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.DATABASE_URI;
  if (!uri) {
    throw new Error("Missing DATABASE_URL");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((m) => m);
  }

  cached.conn = await cached.promise;
  (global as typeof globalThis & { _mongoose?: MongooseCache })._mongoose = cached;

  return cached.conn;
}
