import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';

async function seed(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment');
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }

  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`Admin account already exists: ${email}. Skipping.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    email: email.toLowerCase(),
    passwordHash,
    name: 'Admin',
    role: 'admin',
    isActive: true,
    profileCompleted: true,
  });

  console.log(`Admin account created: ${email}`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  mongoose.disconnect().finally(() => process.exit(1));
});
