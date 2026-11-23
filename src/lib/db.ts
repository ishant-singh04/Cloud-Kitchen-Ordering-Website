import mongoose from 'mongoose';

/**
 * MongoDB connection helper.
 * Supports standard MongoDB Atlas URI or local instance via MONGODB_URI.
 * Automatically handles reconnection and connection pooling for Next.js.
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cloudkitchen_pro';

  if (!cached!.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached!.promise = (async () => {
      try {
        console.log(`Connecting to MongoDB at: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
        const m = await mongoose.connect(uri, opts);
        console.log('MongoDB connected successfully.');
        return m;
      } catch (err: any) {
        if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
          console.error('MongoDB connection failed in cloud/production environment:', err?.message);
          throw err;
        }
        console.warn('Initial MongoDB connection failed. Attempting MongoMemoryServer fallback for local testing...', err?.message);
        try {
          // Dynamic import of mongodb-memory-server if installed
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          const mongod = await MongoMemoryServer.create();
          const memoryUri = mongod.getUri();
          console.log(`Fallback MongoMemoryServer started at ${memoryUri}`);
          const m = await mongoose.connect(memoryUri, opts);
          console.log('Connected to embedded MongoMemoryServer.');
          return m;
        } catch (memErr) {
          console.error('MongoDB Memory Server also failed or not available:', memErr);
          throw err;
        }
      }
    })();
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}
