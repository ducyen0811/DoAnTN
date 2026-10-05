import { Router } from "express";
import { prisma } from "../../db.js";
import { userId } from "../../shared/http.js";
import { activitySchema, daySchema } from "./schemas.js";

export const router = Router();

router.get("/activity/:day", async (req, res) => {
  const day = daySchema.parse(req.params.day);
  const activity = await prisma.activity.findUnique({
    where: { user_id_date: { user_id: userId(res), date: new Date(day) } },
  });
  res.json({ date: day, source: "manual", data: activity?.data ?? null });
});
router.put("/activity/:day", async (req, res) => {
  const day = daySchema.parse(req.params.day);
  const data = activitySchema.parse(req.body);
  await prisma.activity.upsert({
    where: { user_id_date: { user_id: userId(res), date: new Date(day) } },
    create: { user_id: userId(res), date: new Date(day), data },
    update: { data },
  });
  res.json({ date: day, source: "manual", data });
});
