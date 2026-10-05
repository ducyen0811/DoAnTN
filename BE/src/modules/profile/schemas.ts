import { z } from "zod";

export const profileSchema = z
  .object({
    fullName: z.string().trim().min(1).max(100),
    age: z.number().int().min(18).max(120),
    gender: z.enum(["male", "female", "other"]),
    heightCm: z.number().finite().min(100).max(250),
    activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
    healthGoal: z.enum(["maintain", "lose", "gain", "fitness"]),
  })
  .strict();
export type Profile = z.infer<typeof profileSchema> & { weightKg: number };

