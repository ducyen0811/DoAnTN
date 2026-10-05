import { type Measurement } from "@prisma/client";
import { type Database } from "../../db.js";
import { ApiError } from "../../errors.js";
import { MEASUREMENT_TIMEOUT_MS, MEASUREMENT_FRESHNESS_MS } from "../../constants.js";

export type MeasurementRow = Measurement;
export const measurementView = (m: MeasurementRow, now = Date.now()) => ({
  id: m.id,
  deviceId: m.device_id,
  source: m.source,
  scenario: m.scenario,
  status:
    m.status === "pending" && now - m.started_at.getTime() >= MEASUREMENT_TIMEOUT_MS
      ? "expired"
      : m.status,
  heartRate: m.heart_rate,
  spo2: m.spo2,
  context: m.context,
  startedAt: m.started_at,
  measuredAt: m.measured_at?.getTime() ?? null,
  stale: m.measured_at !== null && now - m.measured_at.getTime() >= MEASUREMENT_FRESHNESS_MS,
});
export async function latestMeasurement(db: Database, userId: string) {
  return db.measurement.findFirst({
    where: { user_id: userId },
    orderBy: [{ started_at: "desc" }, { id: "desc" }],
  });
}
export async function ownedMeasurement(db: Database, id: string, userId: string) {
  const measurement = await db.measurement.findFirst({ where: { id, user_id: userId } });
  if (!measurement) throw new ApiError(404, "Không tìm thấy phiên đo");
  return measurement;
}
export async function finish(
  db: Database,
  id: string,
  valid: boolean,
  heartRate: number | null,
  spo2: number | null,
  scenario: string | null,
) {
  const rows = await db.measurement.updateManyAndReturn({
    where: {
      id,
      status: "pending",
      started_at: { gt: new Date(Date.now() - MEASUREMENT_TIMEOUT_MS) },
    },
    data: {
      status: valid ? "completed" : "invalid",
      heart_rate: valid ? heartRate : null,
      spo2: valid ? spo2 : null,
      scenario,
      measured_at: new Date(),
    },
  });
  if (!rows[0]) throw new ApiError(409, "Phiên đo đã kết thúc hoặc hết hạn");
  return measurementView(rows[0]);
}
