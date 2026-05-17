import mongoose from 'mongoose';
import config from '../config';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Atlas connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
}
