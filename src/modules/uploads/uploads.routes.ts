import { Hono } from "hono";
import { v2 as cloudinary } from "cloudinary";
import { authenticate, authorize } from "../../middleware";

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
