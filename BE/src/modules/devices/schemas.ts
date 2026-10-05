import { z } from "zod";

export const deviceSchema = z.object({ name: z.string().trim().min(1).max(100) }).strict();
export const heartbeatSchema = z
  .object({ batteryPercent: z.number().int().min(0).max(100).default(100) })
  .strict();
export const readingSchema = z
  .object({
    valid: z.boolean(),
    heartRateBpm: z.number().finite().min(20).max(300).optional(),
    spo2Percent: z.number().finite().min(0).max(100).optional(),
  })
  .strict()
  .refine((v) => !v.valid || (v.heartRateBpm !== undefined && v.spo2Percent !== undefined), {
    message: "Valid readings require heartRateBpm and spo2Percent",
  });
