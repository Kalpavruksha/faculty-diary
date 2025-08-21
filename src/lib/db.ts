import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache;
}

let cached: MongooseCache = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    console.log('Using cached database connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000
    };

    try {
      console.log('Connecting to MongoDB...', MONGODB_URI?.split('@')[1]);
      cached.promise = mongoose.connect(MONGODB_URI!, opts);
    } catch (error) {
      console.error('Error creating MongoDB connection promise:', error);
      cached.promise = null;
      throw error;
    }
  }

  try {
    console.log('Waiting for MongoDB connection...');
    const mongoose = await cached.promise;
    console.log('MongoDB connected successfully');
    cached.conn = mongoose;
    return mongoose;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    cached.promise = null;
    throw error;
  }
}

export default dbConnect; 