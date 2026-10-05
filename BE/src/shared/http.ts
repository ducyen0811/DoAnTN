import type { Request, Response } from "express";
import { uuidSchema } from "../schemas.js";

export const userId = (res: Response): string => res.locals.userId;
export const idParam = (req: Request, key: string) => uuidSchema.parse(req.params[key]);
