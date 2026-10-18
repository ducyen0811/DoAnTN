import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { chatSchema, replyToChat } from "./modules/chat/service.js";

export function createChatApp(fetcher: typeof fetch = fetch) {
  const app = express();
  const origins = ["http://localhost:5173", "http://127.0.0.1:5173"];
  app.disable("x-powered-by");
  app.use(helmet());
  app.use((_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
  app.use((req, res, next) => {
    if (req.headers.origin && !origins.includes(req.headers.origin)) {
      res.status(403).json({ detail: "Origin không được phép" });
      return;
    }
    next();
  });
  app.use(cors({ origin: origins, methods: ["POST"], allowedHeaders: ["Content-Type"] }));
  app.use(express.json({ limit: "48kb" }));
  app.post("/chat-api/messages", rateLimit({
    windowMs: 60000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false,
    message: { detail: "Bạn gửi quá nhanh. Vui lòng thử lại sau một phút." },
  }), async (req, res) => {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ detail: "Câu hỏi hoặc dữ liệu hội thoại không hợp lệ." });
      return;
    }
    try { res.json(await replyToChat(parsed.data, fetcher)); }
    catch { res.status(503).json({ detail: "Chưa nhận được phản hồi từ AI cục bộ. Kiểm tra Ollama và model đã cài, rồi thử lại." }); }
  });
  app.use((_req, res) => { res.status(404).json({ detail: "API endpoint not found" }); });
  app.use(((error, _req, res, _next) => {
    const status = error?.type === "entity.too.large" ? 413 : error?.type === "entity.parse.failed" ? 400 : 500;
    res.status(status).json({ detail: "Dữ liệu gửi lên không hợp lệ hoặc không xử lý được." });
  }) as express.ErrorRequestHandler);
  return app;
}
