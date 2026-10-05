import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db.js";
import { digest } from "../src/security.js";
import { hashPassword, verifyPassword } from "../src/modules/auth/service.js";
import { decodeJwt, decodeProtectedHeader, SignJWT } from "jose";
import { config } from "../src/config.js";

const app = createApp();
const api = "/api/v1";
const users: string[] = [];
const registration = () => ({
  email: `test-${randomUUID()}@example.com`,
  password: "test-password-123",
  fullName: "Nguyễn An",
  age: 24,
  gender: "male",
  heightCm: 172,
  weightKg: 66.5,
  activityLevel: "moderate",
  healthGoal: "maintain",
});
async function register() {
  const payload = registration();
  const response = await request(app)
    .post(api + "/auth/register")
    .send(payload)
    .expect(201);
  const data = response.body;
  users.push(data.data.profile.id);
  return {
    payload,
    data,
    headers: { Authorization: `Bearer ${data.accessToken}` },
    id: data.data.profile.id as string,
  };
}
before(async () => {
  await prisma.user.findFirst({ select: { id: true } });
});
after(async () => {
  // Remove only users created by this run. Never truncate the application database.
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.$disconnect();
});

test("health reports PostgreSQL and TypeScript", async () => {
  const result = await request(app).get("/health").expect(200);
  assert.equal(result.body.database, "postgresql");
  assert.equal(result.body.runtime, "node-typescript");
  assert.equal(result.body.orm, "prisma");
});
test("register, hashed credentials, case-insensitive login, logout and expiry", async () => {
  await request(app)
    .get(api + "/auth/me")
    .expect(401);
  const u = await register();
  assert.equal(u.data.data.entries.length, 1);
  assert.equal(u.data.data.profile.weightKg, 66.5);
  assert.equal(JSON.stringify(u.data).includes("password"), false);
  const jwt = decodeJwt(u.data.accessToken);
  assert.equal(decodeProtectedHeader(u.data.accessToken).alg, "HS256");
  assert.equal(jwt.sub, u.id);
  assert.equal(jwt.iss, "healthai-api");
  assert.equal(jwt.aud, "healthai-ui");
  assert.equal(jwt.exp! - jwt.iat!, config.SESSION_HOURS * 3600);
  assert.equal(new Date(u.data.expiresAt).getTime(), jwt.exp! * 1000);
  assert.equal(jwt.email, undefined);
  assert.equal(jwt.password, undefined);
  const stored = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
  assert.notEqual(stored.password_hash, u.payload.password);
  await request(app)
    .post(api + "/auth/register")
    .send(u.payload)
    .expect(409);
  await request(app)
    .post(api + "/auth/login")
    .send({ email: u.payload.email, password: "wrong" })
    .expect(401);
  const login = await request(app)
    .post(api + "/auth/login")
    .send({ email: u.payload.email.toUpperCase(), password: u.payload.password })
    .expect(200);
  const headers = { Authorization: `Bearer ${login.body.accessToken}` };
  await request(app)
    .get(api + "/auth/me")
    .set(headers)
    .expect(200);
  await request(app)
    .post(api + "/auth/logout")
    .set(headers)
    .expect(204);
  await request(app)
    .get(api + "/auth/me")
    .set(headers)
    .expect(401);
  await prisma.authSession.update({
    where: { token_hash: digest(u.data.accessToken) },
    data: { expires_at: new Date(Date.now() - 1000) },
  });
  await request(app)
    .get(api + "/auth/me")
    .set(u.headers)
    .expect(401);
});
test("registration rejects invalid fields and injected identity", async () => {
  for (const override of [
    { age: 17 },
    { heightCm: 99 },
    { weightKg: 301 },
    { fullName: "   " },
    { password: "short" },
    { healthGoal: "unknown" },
    { userId: randomUUID() },
  ]) {
    await request(app)
      .post(api + "/auth/register")
      .send({ ...registration(), ...override })
      .expect(422);
  }
});
test("password hashing uses distinct salts and rejects wrong passwords", async () => {
  const first = await hashPassword("same-password-123");
  const second = await hashPassword("same-password-123");
  assert.notEqual(first, second);
  assert.equal(first.includes("same-password-123"), false);
  assert.equal(await verifyPassword("same-password-123", first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
  assert.equal(await verifyPassword("same-password-123", "broken-hash"), false);
});
test("JWT verification rejects forged, expired, wrong-issuer/audience/algorithm tokens even with a stored session", async () => {
  const u = await register();
  const now = Math.floor(Date.now() / 1000);
  const key = new TextEncoder().encode(config.JWT_SECRET);
  const claims = {
    sub: u.id,
    jti: randomUUID(),
    iss: "healthai-api",
    aud: "healthai-ui",
    iat: now,
    exp: now + 3600,
  };
  const sign = (payload = claims, alg = "HS256", signingKey = key) =>
    new SignJWT(payload).setProtectedHeader({ alg, typ: "JWT" }).sign(signingKey);
  const tokens = [
    await sign({ ...claims, exp: now - 1 }),
    await sign({ ...claims, iss: "untrusted-issuer" }),
    await sign({ ...claims, aud: "another-application" }),
    await sign({ ...claims, sub: randomUUID() }),
    await sign(claims, "HS384"),
    await sign(
      claims,
      "HS256",
      new TextEncoder().encode("wrong-secret-key-that-is-at-least-32-characters"),
    ),
  ];
  const parts = u.data.accessToken.split(".");
  parts[1] = Buffer.from(JSON.stringify({ ...claims, exp: now + 86400 })).toString("base64url");
  tokens.push(parts.join("."));
  // Hash rows deliberately exist to prove the API verifies JWT claims/signatures too.
  for (const token of tokens) {
    await prisma.authSession.create({
      data: {
        token_hash: digest(token),
        user_id: u.id,
        expires_at: new Date(Date.now() + 3600000),
      },
    });
    await request(app)
      .get(api + "/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);
  }
  await request(app)
    .get(api + "/auth/me")
    .set(u.headers)
    .expect(200);
  await request(app)
    .post(api + "/auth/logout")
    .set(u.headers)
    .expect(204);
  await request(app)
    .get(api + "/auth/me")
    .set(u.headers)
    .expect(401);
});
test("weekly check-in is atomic under concurrent PostgreSQL requests", async () => {
  const u = await register();
  await request(app)
    .post(api + "/weights")
    .set(u.headers)
    .send({ weight: 65 })
    .expect(409);
  await prisma.user.update({
    where: { id: u.id },
    data: { next_check_in: new Date(Date.now() - 1000) },
  });
  const responses = await Promise.all(
    [65, 64].map((weight) =>
      request(app)
        .post(api + "/weights")
        .set(u.headers)
        .send({ weight }),
    ),
  );
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
  const data = (
    await request(app)
      .get(api + "/auth/me")
      .set(u.headers)
      .expect(200)
  ).body;
  assert.equal(data.entries.length, 2);
  const last = data.entries[1];
  assert.equal(data.profile.weightKg, last.weight);
  assert.ok(Math.abs(last.bmi - last.weight / 1.72 ** 2) < 1e-9);
  const { email, password, weightKg, ...profile } = u.payload;
  await request(app)
    .put(api + "/profile")
    .set(u.headers)
    .send({ ...profile, weightKg: 60 })
    .expect(422);
  await request(app)
    .put(api + "/profile")
    .set(u.headers)
    .send({ ...profile, heightCm: 180 })
    .expect(200);
  const dashboard = (
    await request(app)
      .get(api + "/dashboard")
      .set(u.headers)
      .expect(200)
  ).body;
  assert.ok(Math.abs(dashboard.bmi.value - last.weight / 1.8 ** 2) < 1e-9);
  assert.equal(dashboard.entries[1].bmi, last.bmi);
});
test("simulation lifecycle, invalid readings, cancellation, expiry and freshness", async () => {
  const u = await register();
  const start = async () =>
    (
      await request(app)
        .post(api + "/measurements")
        .set(u.headers)
        .send({ source: "simulation" })
        .expect(201)
    ).body.id as string;
  const id = await start();
  const path = `${api}/measurements/${id}`;
  const pending = await request(app)
    .get(api + "/recommendations")
    .set(u.headers)
    .expect(200);
  assert.equal(pending.body.reading.status, "pending");
  const reading = await request(app)
    .post(path + "/simulate")
    .set(u.headers)
    .send({ scenario: "high" })
    .expect(200);
  assert.equal(reading.body.heartRate, 115);
  assert.equal(reading.body.source, "simulation");
  await request(app)
    .post(path + "/simulate")
    .set(u.headers)
    .send({})
    .expect(409);
  await request(app)
    .post(path + "/cancel")
    .set(u.headers)
    .expect(409);
  await request(app)
    .patch(path + "/context")
    .set(u.headers)
    .send({ context: "resting" })
    .expect(200);
  assert.equal(
    (
      await request(app)
        .get(api + "/recommendations")
        .set(u.headers)
    ).body.riskLevel,
    "warning",
  );
  await prisma.measurement.update({
    where: { id },
    data: { measured_at: new Date(Date.now() - 16 * 60000) },
  });
  assert.equal((await request(app).get(path).set(u.headers)).body.stale, true);
  assert.equal(
    (
      await request(app)
        .get(api + "/recommendations")
        .set(u.headers)
    ).body.headline,
    "Hãy cập nhật lần đo mới",
  );
  const invalid = await start();
  const result = await request(app)
    .post(`${api}/measurements/${invalid}/simulate`)
    .set(u.headers)
    .send({ valid: false })
    .expect(200);
  assert.equal(result.body.status, "invalid");
  assert.equal(result.body.heartRate, null);
  assert.equal(result.body.spo2, null);
  const cancelled = await start();
  await request(app).post(`${api}/measurements/${cancelled}/cancel`).set(u.headers).expect(200);
  await request(app)
    .post(`${api}/measurements/${cancelled}/simulate`)
    .set(u.headers)
    .send({})
    .expect(409);
  const expired = await start();
  await prisma.measurement.update({
    where: { id: expired },
    data: { started_at: new Date(Date.now() - 6 * 60000) },
  });
  assert.equal(
    (await request(app).get(`${api}/measurements/${expired}`).set(u.headers)).body.status,
    "expired",
  );
  await request(app)
    .post(`${api}/measurements/${expired}/simulate`)
    .set(u.headers)
    .send({})
    .expect(409);
  await request(app).post(`${api}/measurements/${expired}/cancel`).set(u.headers).expect(409);
});
test("device ingestion, tenant isolation, replay rejection and revocation", async () => {
  const u = await register();
  const other = await register();
  const device = (
    await request(app)
      .post(api + "/devices")
      .set(u.headers)
      .send({ name: "ESP32" })
      .expect(201)
  ).body;
  const deviceId = device.device.id;
  const key = { "X-Device-Key": device.apiKey };
  const iot = `${api}/iot/devices/${deviceId}`;
  await request(app)
    .post(iot + "/heartbeat")
    .send({})
    .expect(401);
  const heartbeat = await request(app)
    .post(iot + "/heartbeat")
    .set(key)
    .send({ batteryPercent: 85 })
    .expect(200);
  assert.equal(heartbeat.body.status, "connected");
  assert.equal(
    JSON.stringify(
      (
        await request(app)
          .get(api + "/devices")
          .set(u.headers)
      ).body,
    ).includes("apiKey"),
    false,
  );
  const id = (
    await request(app)
      .post(api + "/measurements")
      .set(u.headers)
      .send({ source: "device", deviceId })
      .expect(201)
  ).body.id;
  assert.equal(
    (
      await request(app)
        .get(iot + "/pending")
        .set(key)
    ).body[0].id,
    id,
  );
  await request(app).get(`${api}/measurements/${id}`).set(other.headers).expect(404);
  await request(app)
    .post(api + "/measurements")
    .set(other.headers)
    .send({ source: "device", deviceId })
    .expect(404);
  assert.deepEqual(
    (
      await request(app)
        .get(api + "/measurements")
        .set(other.headers)
    ).body,
    [],
  );
  await request(app).post(`${api}/measurements/${id}/simulate`).set(u.headers).send({}).expect(409);
  const endpoint = iot + `/measurements/${id}`;
  await request(app).post(endpoint).set(key).send({ valid: true }).expect(422);
  const result = await request(app)
    .post(endpoint)
    .set(key)
    .send({ valid: true, heartRateBpm: 78, spo2Percent: 97 })
    .expect(200);
  assert.equal(result.body.heartRate, 78);
  assert.equal(result.body.scenario, null);
  await request(app).post(endpoint).set(key).send({ valid: false }).expect(409);
  const active = (
    await request(app)
      .post(api + "/measurements")
      .set(u.headers)
      .send({ source: "device", deviceId })
  ).body.id;
  await request(app).delete(`${api}/devices/${deviceId}`).set(u.headers).expect(204);
  assert.equal(
    (await request(app).get(`${api}/measurements/${active}`).set(u.headers)).body.status,
    "cancelled",
  );
  await request(app)
    .post(iot + "/heartbeat")
    .set(key)
    .send({})
    .expect(401);
});
test("activity validates dates and supports concurrent upsert", async () => {
  const u = await register();
  const path = api + "/activity/2026-09-28";
  assert.equal((await request(app).get(path).set(u.headers)).body.data, null);
  await request(app)
    .put(api + "/activity/2026-02-30")
    .set(u.headers)
    .send({ steps: 1, caloriesKcal: 1, activeMinutes: 1 })
    .expect(422);
  const results = await Promise.all(
    [2000, 4000].map((steps) =>
      request(app).put(path).set(u.headers).send({ steps, caloriesKcal: 1200, activeMinutes: 20 }),
    ),
  );
  assert.deepEqual(
    results.map((r) => r.status),
    [200, 200],
  );
  assert.ok([2000, 4000].includes((await request(app).get(path).set(u.headers)).body.data.steps));
});
test("weather responses validate upstream data and handle errors", async () => {
  const u = await register();
  const mockFetch: typeof fetch = async (input) =>
    new Response(
      JSON.stringify(
        String(input).includes("air-quality")
          ? { current: { us_aqi: 40, uv_index: 5, time: "2026-09-28T10:00" } }
          : {
              current: {
                temperature_2m: 30,
                relative_humidity_2m: 70,
                weather_code: 0,
                is_day: 1,
                time: "2026-09-28T10:00",
              },
            },
      ),
      { status: 200 },
    );
  const path = api + "/weather?latitude=10.8&longitude=106.6";
  const result = await request(createApp(mockFetch)).get(path).set(u.headers).expect(200);
  assert.equal(result.body.condition, "sunny");
  assert.equal(result.body.source, "Open-Meteo");
  const failed = createApp(async () => {
    throw new Error("offline");
  });
  await request(failed).get(path).set(u.headers).expect(503);
  await request(failed)
    .get(api + "/weather?latitude=999&longitude=1")
    .set(u.headers)
    .expect(422);
});
test("CORS, malformed JSON and query validation", async () => {
  const allowed = await request(app)
    .options(api + "/auth/login")
    .set("Origin", "http://localhost:5173")
    .set("Access-Control-Request-Method", "POST");
  assert.equal(allowed.headers["access-control-allow-origin"], "http://localhost:5173");
  const denied = await request(app)
    .options(api + "/auth/login")
    .set("Origin", "https://untrusted.example")
    .set("Access-Control-Request-Method", "POST");
  assert.equal(denied.headers["access-control-allow-origin"], undefined);
  await request(app)
    .post(api + "/auth/login")
    .set("Content-Type", "application/json")
    .send("{broken")
    .expect(400);
  const u = await register();
  await request(app)
    .get(api + "/measurements?limit=500")
    .set(u.headers)
    .expect(422);
  await request(app)
    .get(api + "/measurements/not-a-uuid")
    .set(u.headers)
    .expect(422);
});


test("feature routers reject unauthenticated requests before reading input", async () => {
  const id = randomUUID();
  const endpoints: ["get" | "post" | "put" | "patch" | "delete", string][] = [
    ["get", "/profile"], ["put", "/profile"],
    ["get", "/weights"], ["post", "/weights"],
    ["get", "/dashboard"],
    ["get", "/devices"], ["post", "/devices"], ["delete", "/devices/" + id],
    ["get", "/measurements"], ["post", "/measurements"],
    ["get", "/measurements/latest"], ["get", "/measurements/" + id],
    ["post", "/measurements/" + id + "/simulate"],
    ["post", "/measurements/" + id + "/cancel"],
    ["patch", "/measurements/" + id + "/context"],
    ["get", "/recommendations"],
    ["get", "/activity/2026-09-30"], ["put", "/activity/2026-09-30"],
    ["get", "/weather"], ["get", "/auth/me"], ["post", "/auth/logout"],
  ];
  for (const [method, endpoint] of endpoints) {
    await request(app)[method](api + endpoint).expect(401).expect("WWW-Authenticate", "Bearer");
  }
});
