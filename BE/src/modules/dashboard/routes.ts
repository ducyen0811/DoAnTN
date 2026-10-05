import { Router } from "express";
import { readSnapshot } from "../../db.js";
import { userId } from "../../shared/http.js";
import { getUser } from "../profile/service.js";
import { bmi, sessionView } from "../weights/service.js";
import { measurementView, latestMeasurement } from "../measurements/service.js";
import { recommendation } from "../recommendations/service.js";

export const router = Router();

router.get("/dashboard", async (_req, res) => {
  res.json(
    await readSnapshot(async (db) => {
      const u = await getUser(db, userId(res));
      const m = await latestMeasurement(db, u.id);
      return {
        ...(await sessionView(db, u)),
        bmi: bmi(u.profile.weightKg, u.profile.heightCm),
        measurement: m ? measurementView(m) : null,
        recommendation: recommendation(m, u.id),
      };
    }),
  );
});
