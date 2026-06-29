import { Hono } from "hono";
import { v2 as cloudinary } from "cloudinary";
import { authenticate, authorize } from "../../middleware";
import { logger } from "../../config";

const IMAGE_MAGIC_BYTES: Record<string, string[]> = {
  "image/jpeg": ["ffd8ffe0", "ffd8ffe1", "ffd8ffe2"],
  "image/png": ["89504e47"],
  "image/webp": ["52494646"],
  "image/gif": ["47494638"],
};

function validateImageMagic(buffer: Buffer, mimeType: string): boolean {
  const magicPrefixes = IMAGE_MAGIC_BYTES[mimeType];
  if (!magicPrefixes) return false;
  const hex = buffer.subarray(0, 4).toString("hex");
  return magicPrefixes.some((prefix) => hex.startsWith(prefix));
}

const uploadRoutes = new Hono();

uploadRoutes.post("/cover", authenticate, authorize("admin", "librarian"), async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"] as File;

  if (!file) {
    return c.json({ success: false, message: "No file provided" }, 400);
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ success: false, message: "File must be an image (JPEG, PNG, WebP, or GIF)" }, 400);
  }

  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return c.json({ success: false, message: "File must be less than 5MB" }, 400);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!validateImageMagic(buffer, file.type)) {
    return c.json({ success: false, message: "File content does not match the declared image type" }, 400);
  }

  const b64 = buffer.toString("base64");
  const dataUri = `data:${file.type};base64,${b64}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "library/covers",
    });
    return c.json({
      success: true,
      message: "Upload successful",
      data: { url: result.secure_url },
    });
  } catch (err) {
    logger.error({ err }, "Cloudinary upload failed");
    return c.json({ success: false, message: "Upload failed" }, 500);
  }
});

export default uploadRoutes;
