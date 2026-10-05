import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import { ZodError } from "zod";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { ApiError } from "./errors.js";
import { createApiRouter } from "./routes.js";
import swaggerUi from "swagger-ui-express";
import { openapi } from "./docs.js";

export function createApp(fetcher?: typeof fetch) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: config.CORS_ORIGINS.split(",").map((s) => s.trim()),
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Authorization", "Content-Type", "X-Device-Key"],
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  app.get("/openapi.json", (_req, res) => {
    res.json(openapi);
  });
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));
  app.get("/health", async (_req, res) => {
    try {
      await prisma.user.findFirst({ select: { id: true } });
      res.json({ status: "ok", database: "postgresql", runtime: "node-typescript", orm: "prisma" });
    } catch {
      throw new ApiError(503, "Database unavailable or migrations not applied");
    }
  });
  app.use("/api/v1", createApiRouter(fetcher));
  app.use((_req, res) => {
    res.status(404).json({ detail: "API endpoint not found" });
  });
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) {
      res
        .status(422)
        .json({ detail: error.issues.map((i) => ({ path: i.path, message: i.message })) });
    } else if (error instanceof ApiError) {
      if (error.status === 401) res.setHeader("WWW-Authenticate", "Bearer");
      res.status(error.status).json({ detail: error.detail });
    } else if (error?.type === "entity.parse.failed") {
      res.status(400).json({ detail: "JSON không hợp lệ" });
    } else if (error?.type === "entity.too.large") {
      res.status(413).json({ detail: "Request body quá lớn" });
    } else if (error?.code === "P2002") {
      res.status(409).json({ detail: "Dữ liệu đã tồn tại" });
    } else {
      console.error("Request failed", { code: error?.code ?? "INTERNAL_ERROR" });
      res.status(500).json({ detail: "Lỗi xử lý phía máy chủ" });
    }
  };
  app.use(errors);
  return app;
}
