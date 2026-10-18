import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createChatApp } from "../src/chat-app.js";

const input = {
  messages: [{ role: "user", content: "Xin chào" }],
  context: { profile: null, measurement: null, pending: false, invalid: false, stale: false,
    weather: { temperatureC: 30, uvIndex: 5, humidityPercent: 70, aqi: 40 } },
};
test("chat HTTP handles browser preflight, rejects foreign origins and malformed bodies", async () => {
  let calls = 0;
  const app = createChatApp(async () => {
    calls++;
    return Response.json({ message: { role: "assistant", content: "Xin chào!" } });
  });
  await request(app).options("/chat-api/messages").set("Origin", "http://localhost:5173")
    .set("Access-Control-Request-Method", "POST").expect(204)
    .expect("Access-Control-Allow-Origin", "http://localhost:5173");
  await request(app).post("/chat-api/messages").set("Origin", "https://foreign.example").send(input).expect(403);
  await request(app).post("/chat-api/messages").set("Content-Type", "application/json").send("{bad").expect(400);
  await request(app).post("/chat-api/messages").send({ text: "x".repeat(50000) }).expect(413);
  await request(app).post("/chat-api/messages").send({}).expect(422);
  assert.equal(calls, 0);
  const result = await request(app).post("/chat-api/messages").send(input).expect(200);
  assert.equal(result.body.reply, "Xin chào!");
  await request(app).get("/missing").expect(404);
});
test("chat HTTP bounds model calls and reports upstream failure", async () => {
  let calls = 0;
  const app = createChatApp(async () => { calls++; throw new Error("offline"); });
  for (let i = 0; i < 10; i++) await request(app).post("/chat-api/messages").send(input).expect(503);
  await request(app).post("/chat-api/messages").send(input).expect(429);
  assert.equal(calls, 10);
});
