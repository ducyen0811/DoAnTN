import { Router } from "express";
import { prisma, transaction } from "../../db.js";
import { ApiError } from "../../errors.js";
import { digest, secret } from "../../security.js";
import { userId, idParam } from "../../shared/http.js";
import { deviceView } from "./service.js";
import { deviceSchema } from "./schemas.js";

export const router = Router();

router.post("/devices", async (req, res) => {
  const { name } = deviceSchema.parse(req.body);
  const key = secret();
  const device = await prisma.device.create({
    data: { user_id: userId(res), name, key_hash: digest(key) },
  });
  res.status(201).json({ device: deviceView(device), apiKey: key });
});
router.get("/devices", async (_req, res) => {
  const rows = await prisma.device.findMany({
    where: { user_id: userId(res) },
    orderBy: { id: "asc" },
  });
  res.json(rows.map(deviceView));
});
router.delete("/devices/:deviceId", async (req, res) => {
  const id = idParam(req, "deviceId");
  await transaction(async (db) => {
    const result = await db.device.updateMany({
      where: { id, user_id: userId(res) },
      data: { enabled: false },
    });
    if (!result.count) throw new ApiError(404, "Không tìm thấy thiết bị");
    await db.measurement.updateMany({
      where: { device_id: id, status: "pending" },
      data: { status: "cancelled" },
    });
  });
  res.sendStatus(204);
});
