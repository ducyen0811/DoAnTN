import { z } from "zod";

export const weightSchema = z.object({ weight: z.number().finite().min(20).max(300) }).strict();
