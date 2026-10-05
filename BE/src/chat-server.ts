import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { chatSchema, replyToChat } from "./modules/chat/service.js";

// Local demo companion. No database or simulated sign-in is treated as authentication.
const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "48kb" }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !["http://localhost:5173", "http://127.0.0.1:5173"].includes(origin)) {
    res.status(403).json({ detail: "Origin không được phép" }); return;
  }
  next();
});
app.post("/chat-api/messages", rateLimit({ windowMs: 60000, limit: 10,
  message: { detail: "Bạn gửi quá nhanh. Vui lòng thử lại sau một phút." },
}), async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) { res.status(422).json({ detail: "Câu hỏi hoặc dữ liệu hội thoại không hợp lệ." }); return; }
  try { res.json(await replyToChat(parsed.data)); }
  catch { res.status(503).json({ detail: "Chưa nhận được phản hồi từ AI cục bộ. Kiểm tra Ollama và model đã cài, rồi thử lại." }); }
});
app.use(((error, _req, res, _next) => {
  res.status(error?.type === "entity.too.large" ? 413 : 400).json({ detail: "Dữ liệu gửi lên không hợp lệ hoặc quá lớn." });
}) as express.ErrorRequestHandler);
app.listen(8001, "127.0.0.1", () => console.log("Local AI chat: http://127.0.0.1:8001"));
