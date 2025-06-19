import express, { Application, Request, Response } from "express";
import cors from "cors";
import config from "./config";
import mongoose from "mongoose";
import routes from "./modules/routes";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use(routes);

app.get("/api", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Library Management Server!",
  });
});

async function server() {
  try {
    await mongoose.connect(config.database_url as string);
    console.log("Database connected successfully");

    app.listen(config.port, () => {
      console.log(`Library management API is running on port: ${config.port}`);
    });
  } catch (error) {
    console.error(`Library management API got error: ${error}`);
  }
}

server();
