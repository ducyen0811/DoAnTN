import { test } from "node:test";
import assert from "node:assert/strict";
import { bmi } from "../src/modules/weights/service.js";
import { measurementView, type MeasurementRow } from "../src/modules/measurements/service.js";
import { recommendation } from "../src/modules/recommendations/service.js";

test("BMI category boundaries", () => {
  for (const [weight, status] of [
    [18.4, "underweight"],
    [18.5, "normal"],
    [25, "overweight"],
    [30, "obese"],
  ] as const) {
    assert.equal(bmi(weight, 100).status, status);
  }
});
test("rule engine gates incomplete, stale, simulated and device data", () => {
  const now = Date.now();
  const m: MeasurementRow = {
    id: "measurement",
    user_id: "user",
    device_id: null,
    status: "completed",
    source: "simulation",
    scenario: "standard",
    context: "unknown",
    heart_rate: 76,
    spo2: 98,
    started_at: new Date(now),
    measured_at: new Date(now),
  };
  assert.equal(recommendation(null, "user", now).reading, null);
  assert.equal(recommendation(m, "user", now).headline, "Bổ sung bối cảnh lúc đo");
  assert.equal(
    recommendation({ ...m, context: "exercise" }, "user", now).headline,
    "Đã ghi nhận bối cảnh vận động",
  );
  assert.equal(
    recommendation({ ...m, context: "resting" }, "user", now).headline,
    "Đã hoàn tất phiên mô phỏng",
  );
  assert.equal(recommendation({ ...m, scenario: "oxygen" }, "user", now).riskLevel, "warning");
  assert.equal(
    recommendation({ ...m, source: "device", scenario: null }, "user", now).headline,
    "Đã ghi nhận số đo từ thiết bị",
  );
  assert.equal(measurementView(m, now + 900000).stale, true);
  assert.equal(measurementView(m, now + 899999).stale, false);
  assert.equal(measurementView({ ...m, status: "pending" }, now + 300000).status, "expired");
});
