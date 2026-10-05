import { z } from "zod";

export const measurementSchema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("simulation") }).strict(),
  z.object({ source: z.literal("device"), deviceId: z.string().uuid() }).strict(),
]);
export const simulationSchema = z
  .object({
    scenario: z.enum(["standard", "high", "oxygen"]).default("standard"),
    valid: z.boolean().default(true),
  })
  .strict();
export const contextSchema = z
  .object({ context: z.enum(["unknown", "resting", "exercise"]) })
  .strict();
