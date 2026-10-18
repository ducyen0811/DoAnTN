import "dotenv/config";
import { createChatApp } from "./chat-app.js";

// Local demo companion; no simulated sign-in is treated as authentication.
const server = createChatApp().listen(8001, "127.0.0.1", () => {
  console.log("Local AI chat: http://127.0.0.1:8001");
});
server.on("error", (error: NodeJS.ErrnoException) => {
  console.error("Local AI chat could not start", { code: error.code });
  process.exitCode = 1;
});
const shutdown = () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
