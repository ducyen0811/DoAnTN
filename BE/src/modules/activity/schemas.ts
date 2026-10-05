import { z } from "zod";

export const activitySchema = z
  .object({
    steps: z.number().int().min(0).max(200000),
    stepGoal: z.number().int().min(1).max(200000).default(8000),
    caloriesKcal: z.number().finite().min(0).max(20000),
    calorieGoal: z.number().finite().positive().max(20000).default(2000),
    activeMinutes: z.number().int().min(0).max(1440),
  })
  .strict();
export const daySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T00:00:00Z");
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
  });
