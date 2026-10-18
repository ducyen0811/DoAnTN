import "dotenv/config";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db.js";

// Exercises the real database and HTTP handlers without requiring a running server.
// Synthetic readings belong only to this disposable test user and are removed below.
const app = createApp();
const api = "/api/v1";
const email = `iot-smoke-${randomUUID()}@example.com`;
let userId: string | undefined;
try {
  await request(app).get("/health").expect(200);
  const auth = (await request(app).post(api + "/auth/register").send({
    email, password: randomUUID(), fullName: "IoT smoke test", age: 24, gender: "other",
    heightCm: 170, weightKg: 65, activityLevel: "moderate", healthGoal: "maintain",
  }).expect(201)).body;
  userId = auth.data.profile.id;
  const userKey = { Authorization: `Bearer ${auth.accessToken}` };
  const created = (await request(app).post(api + "/devices").set(userKey).send({ name: "Disposable ESP32 transport test" }).expect(201)).body;
  const iot = `${api}/iot/devices/${created.device.id}`;
  const key = { "X-Device-Key": created.apiKey };
  await request(app).post(iot + "/heartbeat").set(key).send({ batteryPercent: 85 }).expect(200);
  const start = async () => (await request(app).post(api + "/measurements").set(userKey)
    .send({ source: "device", deviceId: created.device.id }).expect(201)).body;
  const reading = await start();
  assert.equal((await request(app).get(iot + "/pending").set(key).expect(200)).body[0].id, reading.id);
  const result = (await request(app).post(`${iot}/measurements/${reading.id}`).set(key)
    .send({ valid: true, heartRateBpm: 78, spo2Percent: 97 }).expect(200)).body;
  assert.equal(result.status, "completed");
  await request(app).post(`${iot}/measurements/${reading.id}`).set(key).send({ valid: false }).expect(409);
  const invalid = await start();
  assert.equal((await request(app).post(`${iot}/measurements/${invalid.id}`).set(key).send({ valid: false }).expect(200)).body.heartRate, null);
  const cancelled = await start();
  await request(app).post(`${api}/measurements/${cancelled.id}/cancel`).set(userKey).expect(200);
  await request(app).post(`${iot}/measurements/${cancelled.id}`).set(key).send({ valid: false }).expect(409);
  const rotated = (await request(app).post(`${api}/devices/${created.device.id}/rotate-key`).set(userKey).expect(200)).body;
  await request(app).get(iot + "/pending").set(key).expect(401);
  await request(app).post(iot + "/heartbeat").set("X-Device-Key", rotated.apiKey).send({}).expect(200);
  await request(app).get(`${api}/devices/${created.device.id}/diagnostics`).set(userKey).expect(200);
  console.log("PASS: heartbeat, command polling, result, invalid signal, replay, cancellation, key rotation, diagnostics.");
} catch (error) {
  console.error("IoT smoke test failed:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
} finally {
  // Includes the unique email guard if registration succeeded but response parsing failed.
  await prisma.user.deleteMany({ where: { email, ...(userId ? { id: userId } : {}) } });
  await prisma.$disconnect();
  console.log("Disposable IoT test data cleaned up.");
}
