import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AddressInfo } from "node:net";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db.js";

const run = promisify(execFile);
test("IoT probe authenticates against a running server without submitting readings", async () => {
  const app = createApp();
  const email = `probe-${randomUUID()}@example.com`;
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  try {
    const auth = (await request(app).post("/api/v1/auth/register").send({
      email, password: randomUUID(), fullName: "Probe test", age: 24, gender: "other",
      heightCm: 170, weightKg: 65, activityLevel: "moderate", healthGoal: "maintain",
    }).expect(201)).body;
    const created = (await request(app).post("/api/v1/devices").set("Authorization", `Bearer ${auth.accessToken}`)
      .send({ name: "Probe device" }).expect(201)).body;
    const env = { ...process.env, IOT_BASE_URL: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
      IOT_DEVICE_ID: created.device.id, IOT_DEVICE_KEY: created.apiKey };
    const args = ["--import", "tsx", "scripts/iot-probe.ts"];
    const result = await run(process.execPath, args, { env, timeout: 20000 });
    assert.match(result.stdout, /PASS: API reachable/);
    assert.equal(result.stdout.includes(created.apiKey), false);
    const stored = await prisma.device.findUniqueOrThrow({ where: { id: created.device.id } });
    assert.ok(stored.last_seen);
    assert.equal(await prisma.measurement.count({ where: { device_id: created.device.id } }), 0);
    await assert.rejects(run(process.execPath, args, { env: { ...env, IOT_DEVICE_KEY: "wrong" }, timeout: 20000 }),
      (error: unknown) => String((error as { stderr: string }).stderr).includes("HTTP 401"));
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
});
