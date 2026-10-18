import { z } from "zod";
import { profileSchema } from "./modules/profile/schemas.js";
import { activitySchema } from "./modules/activity/schemas.js";

const dateTime = z.string().datetime();
const uuid = z.string().uuid();
export const profileResponse = profileSchema.extend({ id: uuid, email: z.string().email(), weightKg: z.number() });
const weightEntry = z.object({ recordedAt: dateTime, weight: z.number(), bmi: z.number() });
export const weightsResponse = z.object({ entries: z.array(weightEntry), nextCheckInAt: dateTime });
export const sessionResponse = weightsResponse.extend({ profile: profileResponse });
export const authResponse = z.object({
  accessToken: z.string(), tokenType: z.literal("bearer"), expiresAt: dateTime, data: sessionResponse,
});
export const deviceResponse = z.object({
  id: uuid, name: z.string(), model: z.string(), status: z.enum(["connected", "disconnected"]),
  lastUpdated: z.string(), batteryPercent: z.number().int(), enabled: z.boolean(),
});
export const deviceKeyResponse = z.object({ device: deviceResponse, apiKey: z.string() });
export const measurementResponse = z.object({
  id: uuid, deviceId: uuid.nullable(), source: z.enum(["simulation", "device"]),
  scenario: z.enum(["standard", "high", "oxygen"]).nullable(),
  status: z.enum(["pending", "completed", "invalid", "cancelled", "expired"]),
  heartRate: z.number().nullable(), spo2: z.number().nullable(),
  context: z.enum(["unknown", "resting", "exercise"]), startedAt: dateTime,
  measuredAt: z.number().int().nullable().describe("Server timestamp in Unix milliseconds"), stale: z.boolean(),
});
export const diagnosticsResponse = z.object({
  device: deviceResponse, serverTime: dateTime, lastSeenAt: dateTime.nullable(),
  heartbeatAgeMs: z.number().nullable(), heartbeatTimeoutMs: z.number(),
  recommendedHeartbeatIntervalMs: z.number(), recommendedPollIntervalMs: z.number(), measurementTimeoutMs: z.number(),
  pendingMeasurements: z.array(measurementResponse), latestMeasurement: measurementResponse.nullable(),
});
export const recommendationResponse = z.object({
  id: uuid, headline: z.string(), detail: z.string(), tips: z.array(z.string()),
  riskLevel: z.enum(["normal", "warning"]), generatedAt: dateTime, provider: z.literal("rules"),
  reading: measurementResponse.nullable(),
});
export const dashboardResponse = sessionResponse.extend({
  bmi: z.object({ value: z.number(), status: z.enum(["underweight", "normal", "overweight", "obese"]), minHealthy: z.number(), maxHealthy: z.number() }),
  measurement: measurementResponse.nullable(), recommendation: recommendationResponse,
});
export const activityResponse = z.object({ date: z.string(), source: z.literal("manual"), data: activitySchema.nullable() });
export const weatherResponse = z.object({
  location: z.string(), temperatureC: z.number(), humidityPercent: z.number(), uvIndex: z.number(), aqi: z.number(),
  condition: z.enum(["sunny", "clear", "cloudy", "rainy"]), weatherCode: z.number().int(),
  updatedAt: dateTime, airQualityUpdatedAt: dateTime, source: z.literal("Open-Meteo"),
  aqiStandard: z.literal("US AQI"), attribution: z.string(), attributionUrl: z.string().url(),
});
export const errorResponse = z.object({ detail: z.union([
  z.string(),
  z.array(z.object({ path: z.array(z.union([z.string(), z.number()])), message: z.string() })),
  z.object({ message: z.string(), nextCheckInAt: dateTime.optional(), measurementId: uuid.optional() }),
]) });

export function responseSchema(method: string, path: string) {
  if (path === "/auth/register" || path === "/auth/login") return authResponse;
  if (path === "/auth/me") return sessionResponse;
  if (path === "/profile") return profileResponse;
  if (path === "/weights") return method === "get" ? weightsResponse : sessionResponse;
  if (path === "/dashboard") return dashboardResponse;
  if (path.endsWith("/diagnostics")) return diagnosticsResponse;
  if (path.endsWith("/rotate-key")) return deviceKeyResponse;
  if (path === "/devices") return method === "get" ? z.array(deviceResponse) : deviceKeyResponse;
  if (path.endsWith("/heartbeat")) return deviceResponse;
  if (path.endsWith("/pending")) return z.array(measurementResponse);
  if (path === "/measurements" && method === "get") return z.array(measurementResponse);
  if (path === "/measurements/latest") return measurementResponse.nullable();
  if (path.startsWith("/measurements") || path.includes("/measurements/")) return measurementResponse;
  if (path === "/recommendations") return recommendationResponse;
  if (path.startsWith("/activity/")) return activityResponse;
  if (path === "/weather") return weatherResponse;
  return undefined;
}
