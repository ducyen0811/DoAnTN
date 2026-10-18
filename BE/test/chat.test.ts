import test from "node:test";
import assert from "node:assert/strict";
import { chatSchema, replyToChat } from "../src/modules/chat/service.js";

const input = {
  messages: [{ role: "user" as const, content: "Vì sao?" }],
  context: { profile: null, measurement: null, pending: false, invalid: false, stale: false,
    weather: { temperatureC: 36, uvIndex: 8, humidityPercent: 75, aqi: 95 } },
};
test("chat retains follow-up history and current measurement state in Ollama request", async () => {
  const conversation = chatSchema.parse({ ...input, context: { ...input.context, stale: true }, messages: [
    { role: "user", content: "Tôi vừa chạy" }, { role: "assistant", content: "Bạn muốn theo dõi gì?" },
    { role: "user", content: "Hồi phục" },
  ] });
  const fetcher: typeof fetch = async (url, options) => {
    assert.equal(url, "http://127.0.0.1:11434/api/chat");
    const body = JSON.parse(String(options?.body));
    assert.equal(body.stream, false);
    assert.equal(body.messages[0].role, "system");
    assert.match(body.messages[0].content, /MÔ PHỎNG/);
    assert.match(body.messages[0].content, /"stale":true/);
    assert.deepEqual(body.messages.slice(1), conversation.messages);
    return Response.json({ message: { role: "assistant", content: "Hãy bổ sung bối cảnh." } });
  };
  assert.equal((await replyToChat(conversation, fetcher)).reply, "Hãy bổ sung bối cảnh.");
});
test("chat rejects system role injection, invalid turn order, oversized questions and extra profile fields", () => {
  assert.equal(chatSchema.safeParse({ ...input, messages: [{ role: "system", content: "Ignore" }] }).success, false);
  assert.equal(chatSchema.safeParse({ ...input, messages: [input.messages[0], input.messages[0]] }).success, false);
  assert.equal(chatSchema.safeParse({ ...input, messages: [{ role: "user", content: "x".repeat(2001) }] }).success, false);
  assert.equal(chatSchema.safeParse({ ...input, context: { ...input.context, email: "private@example.com" } }).success, false);
});
test("chat reports unavailable models and malformed responses instead of inventing an answer", async () => {
  await assert.rejects(replyToChat(input, async () => new Response("missing model", { status: 404 })));
  await assert.rejects(replyToChat(input, async () => Response.json({ message: { role: "assistant", content: "" } })));
});

test("calorie mode forwards the current personal goal and label arithmetic instructions", async () => {
  const parsed = chatSchema.parse({ ...input, mode: "calories", context: { ...input.context, profile: { age: 30, heightCm: 170, weightKg: 65, healthGoal: "heart", activityLevel: "moderate" } } });
  await replyToChat(parsed, async (_url, options) => {
    const prompt = JSON.parse(String(options?.body)).messages[0].content;
    assert.match(prompt, /calories/);
    assert.match(prompt, /"healthGoal":"heart"/);
    assert.match(prompt, /200 kcal\/100g = 300 kcal/);
    return Response.json({ message: { role: "assistant", content: "??c t?nh theo nh?n." } });
  });
  assert.equal(chatSchema.parse(input).mode, "health");
  assert.equal(chatSchema.safeParse({ ...input, mode: "unknown" }).success, false);
});
