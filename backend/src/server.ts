import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import logger from "./utils/logger";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Morgan HTTP logging channeled through Winston
const morganStream = {
  write: (message: string) => logger.http(message.trim()),
};
app.use(morgan(":method :url :status :res[content-length] - :response-time ms", { stream: morganStream }));

// Health Check Endpoint
app.get("/api/v1/health", async (req: Request, res: Response) => {
  try {
    // Check DB connectivity using Prisma
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "success",
      message: "Educational E-CRM Backend API is healthy and connected to database.",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error(`Database connectivity health check failed: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Database connectivity check failed.",
      error: error.message,
    });
  }
});

// Standard Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${req.method} ${req.url} - ${err.message}`);
  res.status(500).json({
    status: "error",
    code: "INTERNAL_SERVER_ERROR",
    message: err.message || "An unexpected error occurred on the server.",
  });
});

// Start Server listener
app.listen(PORT, () => {
  logger.info(`Server is running in development mode on http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  logger.info("Database connection closed. Exiting server.");
  process.exit(0);
});
export { app, prisma };
