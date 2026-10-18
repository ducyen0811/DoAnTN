import { Router } from "express";
import { prisma, transaction, readSnapshot } from "../../db.js";
import { DEVICE_HEARTBEAT_TIMEOUT_MS, MEASUREMENT_TIMEOUT_MS } from "../../constants.js";
import { measurementView } from "../measurements/service.js";
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

router.get("/devices/:deviceId/diagnostics", async (req, res) => {
  const id = idParam(req, "deviceId");
  res.json(await readSnapshot(async (db) => {
    const device = await db.device.findFirst({ where: { id, user_id: userId(res) } });
    if (!device) throw new ApiError(404, "Không tìm thấy thiết bị");
    const now = Date.now();
    const pending = await db.measurement.findMany({
      where: { device_id: id, status: "pending", started_at: { gt: new Date(now - MEASUREMENT_TIMEOUT_MS) } },
      orderBy: [{ started_at: "asc" }, { id: "asc" }],
      take: 20,
    });
    const latest = await db.measurement.findFirst({
      where: { device_id: id }, orderBy: [{ started_at: "desc" }, { id: "desc" }],
    });
    return {
      device: deviceView(device),
      serverTime: new Date(now).toISOString(),
      lastSeenAt: device.last_seen?.toISOString() ?? null,
      heartbeatAgeMs: device.last_seen ? Math.max(0, now - device.last_seen.getTime()) : null,
      heartbeatTimeoutMs: DEVICE_HEARTBEAT_TIMEOUT_MS,
      recommendedHeartbeatIntervalMs: 30000,
      recommendedPollIntervalMs: 2000,
      measurementTimeoutMs: MEASUREMENT_TIMEOUT_MS,
      pendingMeasurements: pending.map((m) => measurementView(m, now)),
      latestMeasurement: latest ? measurementView(latest, now) : null,
    };
  }));
});

router.post("/devices/:deviceId/rotate-key", async (req, res) => {
  const id = idParam(req, "deviceId");
  const apiKey = secret();
  const device = await transaction(async (db) => {
    const current = await db.device.findFirst({ where: { id, user_id: userId(res) } });
    if (!current) throw new ApiError(404, "Không tìm thấy thiết bị");
    if (!current.enabled) throw new ApiError(409, "Thiết bị đã bị thu hồi");
    return db.device.update({ where: { id }, data: { key_hash: digest(apiKey), last_seen: null } });
  });
  res.json({ device: deviceView(device), apiKey });
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
