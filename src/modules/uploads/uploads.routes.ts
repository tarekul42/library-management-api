import { Hono } from "hono";
import { v2 as cloudinary } from "cloudinary";
import { authenticate, authorize } from "../../middleware";
import { getEnv } from "../../config";

const uploadRoutes = new Hono();

uploadRoutes.post("/cover", authenticate, authorize("admin", "librarian"), async (c) => {
  const env = getEnv();

  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return c.json({ success: false, message: "Cloudinary not configured" }, 500);
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

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
  } catch {
    return c.json({ success: false, message: "Upload failed" }, 500);
  }
});

export default uploadRoutes;
