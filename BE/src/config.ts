import "dotenv/config";
import { z } from "zod";

const env = z
  .object({
    DATABASE_URL: z
      .string()
      .url()
      .refine((v) => v.startsWith("postgresql://") || v.startsWith("postgres://")),
    PORT: z.coerce.number().int().min(1).max(65535).default(8000),
    HOST: z.string().default("127.0.0.1"),
    CORS_ORIGINS: z.string().default("http://localhost:5173,http://127.0.0.1:5173"),
    SESSION_HOURS: z.coerce.number().int().min(1).max(720).default(24),
    JWT_SECRET: z.string().min(32),
    WEATHER_ENABLED: z.enum(["true", "false"]).default("true"),
  })
  .safeParse(process.env);

if (!env.success)
  throw new Error(
    `Invalid environment variables: ${env.error.issues.map((i) => i.path.join(".")).join(", ")}`,
  );
export const config = env.data;
