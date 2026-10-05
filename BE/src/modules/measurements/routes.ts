import { Router } from "express";
import { prisma, transaction } from "../../db.js";
import { ApiError } from "../../errors.js";
import { MEASUREMENT_TIMEOUT_MS } from "../../constants.js";
import { userId, idParam } from "../../shared/http.js";
import { measurementView, latestMeasurement, ownedMeasurement, finish } from "./service.js";
import { measurementSchema, simulationSchema, contextSchema } from "./schemas.js";
import { paginationSchema } from "../../schemas.js";

export const router = Router();

router.post("/measurements", async (req, res) => {
  const payload = measurementSchema.parse(req.body);
  res.status(201).json(
    await transaction(async (db) => {
      if (payload.source === "device") {
        const device = await db.device.findFirst({
          where: { id: payload.deviceId, user_id: userId(res) },
        });
        if (!device) throw new ApiError(404, "Không tìm thấy thiết bị");
        if (!device.enabled) throw new ApiError(409, "Thiết bị đã bị thu hồi");
      }
      return measurementView(
        await db.measurement.create({
          data: {
            user_id: userId(res),
            source: payload.source,
            device_id: payload.source === "device" ? payload.deviceId : null,
          },
        }),
      );
    }),
  );
});
router.get("/measurements", async (req, res) => {
  const { limit, offset } = paginationSchema.parse(req.query);
  const rows = await prisma.measurement.findMany({
    where: { user_id: userId(res) },
    orderBy: [{ started_at: "desc" }, { id: "desc" }],
    take: limit,
    skip: offset,
  });
  res.json(rows.map((m) => measurementView(m)));
});
router.get("/measurements/latest", async (_req, res) => {
  const measurement = await latestMeasurement(prisma, userId(res));
  res.json(measurement ? measurementView(measurement) : null);
});
router.get("/measurements/:measurementId", async (req, res) => {
  const id = idParam(req, "measurementId");
  res.json(measurementView(await ownedMeasurement(prisma, id, userId(res))));
});
router.post("/measurements/:measurementId/simulate", async (req, res) => {
  const id = idParam(req, "measurementId");
  const { scenario, valid } = simulationSchema.parse(req.body);
  res.json(
    await transaction(async (db) => {
      const m = await ownedMeasurement(db, id, userId(res));
      if (m.source !== "simulation")
        throw new ApiError(409, "Không thể mô phỏng phiên đo thiết bị thật");
      return finish(
        db,
        id,
        valid,
        scenario === "high" ? 115 : 76,
        scenario === "oxygen" ? 92 : 98,
        scenario,
      );
    }),
  );
});
router.post("/measurements/:measurementId/cancel", async (req, res) => {
  const id = idParam(req, "measurementId");
  res.json(
    await transaction(async (db) => {
      await ownedMeasurement(db, id, userId(res));
      const rows = await db.measurement.updateManyAndReturn({
        where: {
          id,
          status: "pending",
          started_at: { gt: new Date(Date.now() - MEASUREMENT_TIMEOUT_MS) },
        },
        data: { status: "cancelled" },
      });
      if (!rows[0]) throw new ApiError(409, "Phiên đo đã kết thúc hoặc hết hạn");
      return measurementView(rows[0]);
    }),
  );
});
router.patch("/measurements/:measurementId/context", async (req, res) => {
  const id = idParam(req, "measurementId");
  const { context } = contextSchema.parse(req.body);
  res.json(
    await transaction(async (db) => {
      await ownedMeasurement(db, id, userId(res));
      const rows = await db.measurement.updateManyAndReturn({
        where: { id, status: "completed" },
        data: { context },
      });
      if (!rows[0]) throw new ApiError(409, "Phiên đo chưa có kết quả hợp lệ");
      return measurementView(rows[0]);
    }),
  );
});
