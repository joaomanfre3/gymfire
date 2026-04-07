import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export async function uploadImage(
  file: File,
  folder: string,
): Promise<UploadResult> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `gymfire/${folder}`,
        format: 'webp',
        quality: 'auto:good',
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good', fetch_format: 'webp' },
        ],
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    ).end(buffer);
  });
}

export async function uploadVideo(
  file: File,
  folder: string,
): Promise<UploadResult> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `gymfire/${folder}`,
        resource_type: 'video',
        quality: 'auto:good',
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    ).end(buffer);
  });
}

export async function uploadMedia(
  file: File,
  folder: string,
): Promise<UploadResult & { mediaType: 'IMAGE' | 'VIDEO' }> {
  const isVideo = file.type.startsWith('video/');

  if (isVideo) {
    const result = await uploadVideo(file, folder);
    return { ...result, mediaType: 'VIDEO' };
  }

  const result = await uploadImage(file, folder);
  return { ...result, mediaType: 'IMAGE' };
}

export async function deleteMedia(publicId: string, resourceType: 'image' | 'video' = 'image') {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch {
    // ignore deletion errors
  }
}

export { cloudinary };
