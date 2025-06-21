import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import config from "./config";
import mongoose from "mongoose";
import routes from "./modules/routes";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use(routes);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Library Management Server!",
  });
});

// universal 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    error: {
      code: 404,
      description: "The requested endpoint does not exist.",
    },
  });
  next();
});

// global error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error) {
    console.log("Error", error);
    res
      .status(400)
      .json({ message: "Something went wrong from global error", error });
  }
  next();
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
