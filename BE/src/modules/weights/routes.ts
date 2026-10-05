import { Router } from "express";
import { transaction, readSnapshot } from "../../db.js";
import { ApiError } from "../../errors.js";
import { WEIGHT_CHECK_IN_MS } from "../../constants.js";
import { userId } from "../../shared/http.js";
import { getUser, userView } from "../profile/service.js";
import { bmi, sessionView } from "./service.js";
import { weightSchema } from "./schemas.js";

export const router = Router();

router.get("/weights", async (_req, res) => {
  res.json(
    await readSnapshot(async (db) => {
      const data = await sessionView(db, await getUser(db, userId(res)));
      return { entries: data.entries, nextCheckInAt: data.nextCheckInAt };
    }),
  );
});
router.post("/weights", async (req, res) => {
  const { weight } = weightSchema.parse(req.body);
  res.status(201).json(
    await transaction(async (db) => {
      const current = await getUser(db, userId(res));
      const now = new Date();
      const rows = await db.user.updateManyAndReturn({
        where: { id: current.id, next_check_in: { lte: now } },
        data: {
          next_check_in: new Date(now.getTime() + WEIGHT_CHECK_IN_MS),
          profile: { ...current.profile, weightKg: weight },
        },
      });
      if (!rows[0]) {
        throw new ApiError(409, {
          message: "Chỉ cập nhật cân nặng sau 7 ngày",
          nextCheckInAt: current.next_check_in,
        });
      }
      const u = userView(rows[0]);
      await db.weightEntry.create({
        data: { user_id: u.id, weight, bmi: bmi(weight, u.profile.heightCm).value },
      });
      return sessionView(db, u);
    }),
  );
});
