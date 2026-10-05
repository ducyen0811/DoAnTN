import { z } from "zod";

export const querySchema = z.object({
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
  location: z.string().max(100).default("Vị trí đã chọn"),
});

