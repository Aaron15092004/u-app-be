import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import config from '../config';

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImage(
  buffer: Buffer,
  options: { folder?: string; publicId?: string; transformation?: object } = {}
): Promise<{ url: string; publicId: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'u-app/food',
      resource_type: 'image' as const,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error || !result) {
        reject(error || new Error('Upload failed'));
        return;
      }
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      });
    });

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export async function testConnection(): Promise<boolean> {
  try {
    await cloudinary.api.ping();
    return true;
  } catch {
    return false;
  }
}
