import { v2 as cloudinary } from "cloudinary";
import { AppError } from '../../shared/errors.js';

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateMagicBytes(buffer: ArrayBuffer): boolean {
  const arr = new Uint8Array(buffer);
  // JPEG: FF D8 FF, PNG: 89 50 4E 47, WebP: 52 49 46 46 * 57 45 42 50, GIF: 47 49 46 38
  if (arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff) return true;
  if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4e && arr[3] === 0x47) return true;
  if (
    arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46 &&
    arr[8] === 0x57 && arr[9] === 0x45 && arr[10] === 0x42 && arr[11] === 0x50
  ) return true;
  if (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x38) return true;
  return false;
}

export async function uploadFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new AppError("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed", 400);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new AppError("File size exceeds 5MB limit", 400);
  }

  const buffer = await file.arrayBuffer();
  if (!validateMagicBytes(buffer)) {
    throw new AppError("File content does not match its type", 400);
  }

  const b64 = Buffer.from(buffer).toString("base64");
  const dataUri = `data:${file.type};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "library",
  });

  return { url: result.secure_url, publicId: result.public_id };
}
