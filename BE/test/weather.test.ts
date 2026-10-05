import { test } from "node:test";
import assert from "node:assert/strict";
import { createWeatherService } from "../src/modules/weather/service.js";

function successfulFetcher(onCall: () => void): typeof fetch {
  return async (input) => {
    onCall();
    return new Response(
      JSON.stringify(
        String(input).includes("air-quality")
          ? { current: { us_aqi: 40, uv_index: 5, time: "2026-09-29T10:00" } }
          : {
              current: {
                temperature_2m: 30,
                relative_humidity_2m: 70,
                weather_code: 0,
                is_day: 1,
                time: "2026-09-29T10:00",
              },
            },
      ),
    );
  };
}

test("weather shares in-flight requests and refreshes expired cache entries", async () => {
  let calls = 0;
  let now = 0;
  const weather = createWeatherService(
    successfulFetcher(() => calls++),
    { ttlMs: 100, now: () => now },
  );
  const results = await Promise.all(Array.from({ length: 10 }, () => weather(10, 106)));
  assert.equal(calls, 2); // One weather + one AQI request for all callers.
  assert.ok(results.every((result) => result.temperatureC === 30));
  now = 99;
  await weather(10, 106);
  assert.equal(calls, 2);
  now = 100;
  await weather(10, 106);
  assert.equal(calls, 4);
});

test("weather evicts old entries and keeps coordinates separate", async () => {
  let calls = 0;
  const weather = createWeatherService(
    successfulFetcher(() => calls++),
    { maxEntries: 2 },
  );
  await weather(10, 106);
  await weather(11, 106);
  await weather(10, 106); // Make this entry most recently used.
  await weather(12, 106); // Evict 11,106.
  await weather(10, 106);
  assert.equal(calls, 6);
  await weather(11, 106);
  assert.equal(calls, 8);
});

test("weather failures are not cached and a later request can recover", async () => {
  let fail = true;
  let calls = 0;
  const success = successfulFetcher(() => calls++);
  const weather = createWeatherService(async (...args) => {
    if (fail) throw new Error("offline");
    return success(...args);
  });
  await assert.rejects(weather(10, 106), /offline/);
  fail = false;
  assert.equal((await weather(10, 106)).condition, "sunny");
  assert.equal(calls, 2);
});

test("malformed weather responses are rejected instead of cached", async () => {
  const weather = createWeatherService(async () => new Response('{"current":null}'));
  await assert.rejects(weather(10, 106));
});
