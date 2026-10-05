import { createApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./db.js";

try {
  await prisma.user.findFirst({ select: { id: true } });
  const server = createApp().listen(config.PORT, config.HOST);
  server.once("listening", () => {
    console.log(`HealthAI TypeScript API: http://${config.HOST}:${config.PORT} (PostgreSQL)`);
  });
  server.on("error", async (error) => {
    const code = (error as NodeJS.ErrnoException).code;
    console.error(
      code === "EADDRINUSE"
        ? `Port ${config.PORT} is already in use. Stop the previous backend process before running npm run dev.`
        : `Server could not start: ${code ?? error.message}`,
    );
    await prisma.$disconnect();
    process.exitCode = 1;
  });
  const shutdown = () => {
    server.close(() => {
      void prisma.$disconnect().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
} catch (error) {
  console.error("Cannot connect to PostgreSQL. Check .env and run npm run db:migrate.", {
    code: (error as NodeJS.ErrnoException).code,
  });
  await prisma.$disconnect();
  process.exitCode = 1;
}
