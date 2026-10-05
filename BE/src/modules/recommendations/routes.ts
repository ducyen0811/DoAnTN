import { Router } from "express";
import { prisma } from "../../db.js";
import { userId } from "../../shared/http.js";
import { latestMeasurement } from "../measurements/service.js";
import { recommendation } from "./service.js";

export const router = Router();

router.get("/recommendations", async (_req, res) => {
  res.json(recommendation(await latestMeasurement(prisma, userId(res)), userId(res)));
});
