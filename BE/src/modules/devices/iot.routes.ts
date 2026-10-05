import { Router } from "express";
import { transaction, readSnapshot } from "../../db.js";
import { ApiError } from "../../errors.js";
import { MEASUREMENT_TIMEOUT_MS } from "../../constants.js";
import { idParam } from "../../shared/http.js";
import { authenticateDevice } from "./middleware.js";
import { deviceView } from "./service.js";
import { measurementView, finish } from "../measurements/service.js";
import { heartbeatSchema, readingSchema } from "./schemas.js";

export const router = Router();

router.post("/iot/devices/:deviceId/heartbeat", async (req, res) => {
  const payload = heartbeatSchema.parse(req.body);
  res.json(
    await transaction(async (db) => {
      const d = await authenticateDevice(db, req);
      return deviceView(
        await db.device.update({
          where: { id: d.id },
          data: { last_seen: new Date(), battery: payload.batteryPercent },
        }),
      );
    }),
  );
});
router.get("/iot/devices/:deviceId/pending", async (req, res) => {
  res.json(
    await readSnapshot(async (db) => {
      const d = await authenticateDevice(db, req);
      const rows = await db.measurement.findMany({
        where: {
          device_id: d.id,
          status: "pending",
          started_at: { gt: new Date(Date.now() - MEASUREMENT_TIMEOUT_MS) },
        },
        orderBy: { started_at: "asc" },
        take: 20,
      });
      return rows.map((m) => measurementView(m));
    }),
  );
});
router.post("/iot/devices/:deviceId/measurements/:measurementId", async (req, res) => {
  const payload = readingSchema.parse(req.body);
  const id = idParam(req, "measurementId");
  res.json(
    await transaction(async (db) => {
      const d = await authenticateDevice(db, req);
      const measurement = await db.measurement.findFirst({
        where: { id, device_id: d.id, user_id: d.user_id, source: "device" },
      });
      if (!measurement) throw new ApiError(404, "Không tìm thấy phiên đo của thiết bị");
      const result = await finish(
        db,
        id,
        payload.valid,
        payload.heartRateBpm ?? null,
        payload.spo2Percent ?? null,
        null,
      );
      await db.device.update({ where: { id: d.id }, data: { last_seen: new Date() } });
      return result;
    }),
  );
});
