import { Hono } from "hono";

const uploadRoutes = new Hono();

uploadRoutes.post("/cover", async (c) => {
  return c.json({
    success: true,
    message: "Upload endpoint ready",
    data: { url: null },
  });
});

export default uploadRoutes;
