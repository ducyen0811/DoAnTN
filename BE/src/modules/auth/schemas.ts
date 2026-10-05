import { z } from "zod";
import { profileSchema } from "../profile/schemas.js";
import { weightSchema } from "../weights/schemas.js";

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(320)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(1).max(128),
  })
  .strict();
export const registerSchema = profileSchema
  .extend({
    email: loginSchema.shape.email,
    password: z.string().min(8).max(128),
    weightKg: weightSchema.shape.weight,
  })
  .strict();
