import "dotenv/config";
import { z } from "zod";
import { deviceResponse, measurementResponse } from "../src/response-schemas.js";

// Uses the running HTTP server. Never prints the device key or submits synthetic readings.
const env = z.object({
  IOT_BASE_URL: z.string().url().default("http://127.0.0.1:8000"),
  IOT_DEVICE_ID: z.string().uuid(),
  IOT_DEVICE_KEY: z.string().min(1),
}).safeParse(process.env);
if (!env.success) {
  console.error("Configure IOT_BASE_URL, IOT_DEVICE_ID and IOT_DEVICE_KEY in .env. Invalid fields:",
    env.error.issues.map((i) => i.path.join(".")).join(", "));
  process.exitCode = 1;
} else {
  try {
    const { IOT_BASE_URL, IOT_DEVICE_ID, IOT_DEVICE_KEY } = env.data;
    const base = new URL(IOT_BASE_URL);
    if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.pathname !== "/") {
      throw new Error("IOT_BASE_URL must be an HTTP(S) origin, e.g. http://192.168.1.10:8000");
    }
    const call = async (path: string, heartbeat = false) => {
      const response = await fetch(new URL(path, base), {
        method: heartbeat ? "POST" : "GET", redirect: "error", signal: AbortSignal.timeout(10000),
        headers: { "X-Device-Key": IOT_DEVICE_KEY, ...(heartbeat ? { "Content-Type": "application/json" } : {}) },
        ...(heartbeat ? { body: "{}" } : {}),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.status === 401 ? "Device key invalid or device revoked" : "Check API logs and request configuration"}`);
      return response.json();
    };
    const path = `/api/v1/iot/devices/${IOT_DEVICE_ID}`;
    const device = deviceResponse.parse(await call(path + "/heartbeat", true));
    const pending = z.array(measurementResponse).parse(await call(path + "/pending"));
    console.log(`PASS: API reachable, device authenticated, status=${device.status}`);
    console.log(`Pending commands: ${pending.length}`);
    for (const measurement of pending) console.log(`Measurement ${measurement.id}, started ${measurement.startedAt}`);
    console.log("No measurement results were submitted. Heartbeat updated lastSeen and battery defaults to 100%.");
  } catch (error) {
    console.error("IoT probe failed:", error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  }
}
