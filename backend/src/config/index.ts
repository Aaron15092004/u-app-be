import dotenv from 'dotenv';
// override: false ensures process.env values set before this module loads (e.g., test stubs)
// are not overwritten by .env file values.
dotenv.config({ override: false });

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string): string | undefined {
  const value = process.env[key];
  if (!value) {
    console.warn(`Warning: Optional environment variable ${key} is not set`);
  }
  return value;
}

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  MONGODB_URI: required('MONGODB_URI'),
  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
  CLOUDINARY_CLOUD_NAME: required('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: required('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: required('CLOUDINARY_API_SECRET'),
  FIREBASE_PROJECT_ID: required('FIREBASE_PROJECT_ID'),
  FIREBASE_CLIENT_EMAIL: required('FIREBASE_CLIENT_EMAIL'),
  FIREBASE_PRIVATE_KEY: required('FIREBASE_PRIVATE_KEY'),
  LOGMEAL_API_KEY: optional('LOGMEAL_API_KEY'),
  GEMINI_API_KEY: optional('GEMINI_API_KEY'),
  GEMINI_PRIMARY_MODEL: optional('GEMINI_PRIMARY_MODEL'),
  GEMINI_FALLBACK_MODEL: optional('GEMINI_FALLBACK_MODEL'),
  GEMINI_REQUEST_TIMEOUT_MS: process.env.GEMINI_REQUEST_TIMEOUT_MS || '8000',
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:19006').split(','),
};

export default config;
