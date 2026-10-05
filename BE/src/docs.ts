import { profileSchema } from "./modules/profile/schemas.js";
import { weightSchema } from "./modules/weights/schemas.js";
import { deviceSchema, heartbeatSchema, readingSchema } from "./modules/devices/schemas.js";
import { measurementSchema, simulationSchema, contextSchema } from "./modules/measurements/schemas.js";
import { activitySchema } from "./modules/activity/schemas.js";
import { loginSchema, registerSchema } from "./modules/auth/schemas.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodTypeAny } from "zod";

type Method = "get" | "post" | "put" | "patch" | "delete";
const paths: Record<string, Record<string, unknown>> = {};
function endpoint(method: Method, path: string, summary: string, body?: ZodTypeAny, status = 200) {
  const fullPath = `/api/v1${path}`;
  const parameters: unknown[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => ({
    name: m[1],
    in: "path",
    required: true,
    schema: { type: "string", ...(m[1] === "day" ? { format: "date" } : { format: "uuid" }) },
  }));
  if (path === "/weather")
    parameters.push(
      {
        name: "latitude",
        in: "query",
        required: true,
        schema: { type: "number", minimum: -90, maximum: 90 },
      },
      {
        name: "longitude",
        in: "query",
        required: true,
        schema: { type: "number", minimum: -180, maximum: 180 },
      },
      { name: "location", in: "query", schema: { type: "string" } },
    );
  if (path === "/measurements" && method === "get")
    parameters.push(
      {
        name: "limit",
        in: "query",
        schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
      },
      { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
    );
  const publicRoute = path === "/auth/login" || path === "/auth/register";
  paths[fullPath] ??= {};
  paths[fullPath][method] = {
    summary,
    tags: [path.split("/")[1]],
    parameters,
    security: publicRoute
      ? []
      : path.startsWith("/iot/")
        ? [{ DeviceKey: [] }]
        : [{ BearerAuth: [] }],
    ...(body
      ? {
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: zodToJsonSchema(body, { target: "openApi3" }) },
            },
          },
        }
      : {}),
    responses: {
      [status]: { description: "Success; see README for response contract" },
      "401": { description: "Invalid or expired credentials" },
      "404": { description: "Resource not found or not owned" },
      "409": { description: "State conflict" },
      "422": { description: "Invalid input" },
      "503": { description: "Dependency unavailable" },
    },
  };
}
endpoint("post", "/auth/register", "Đăng ký và tạo hồ sơ", registerSchema, 201);
endpoint("post", "/auth/login", "Đăng nhập", loginSchema);
endpoint("post", "/auth/logout", "Thu hồi phiên hiện tại", undefined, 204);
endpoint("get", "/auth/me", "Hồ sơ, lịch sử cân và lịch cân tiếp theo");
endpoint("get", "/profile", "Hồ sơ cá nhân");
endpoint("put", "/profile", "Cập nhật hồ sơ (không cập nhật cân nặng)", profileSchema);
endpoint("get", "/weights", "Lịch sử cân");
endpoint("post", "/weights", "Cân hằng tuần", weightSchema, 201);
endpoint("get", "/dashboard", "Tổng quan");
endpoint("get", "/devices", "Thiết bị của tài khoản");
endpoint("post", "/devices", "Tạo thiết bị và cấp khóa một lần", deviceSchema, 201);
endpoint("delete", "/devices/{deviceId}", "Thu hồi thiết bị", undefined, 204);
endpoint("post", "/iot/devices/{deviceId}/heartbeat", "Thiết bị báo kết nối", heartbeatSchema);
endpoint("get", "/iot/devices/{deviceId}/pending", "Thiết bị lấy phiên chờ đo");
endpoint(
  "post",
  "/iot/devices/{deviceId}/measurements/{measurementId}",
  "Thiết bị gửi kết quả",
  readingSchema,
);
endpoint("post", "/measurements", "Tạo phiên đo", measurementSchema, 201);
endpoint("get", "/measurements", "Lịch sử đo");
endpoint("get", "/measurements/latest", "Phiên mới nhất hoặc null");
endpoint("get", "/measurements/{measurementId}", "Xem phiên đo");
endpoint(
  "post",
  "/measurements/{measurementId}/simulate",
  "Hoàn tất phiên mô phỏng",
  simulationSchema,
);
endpoint("post", "/measurements/{measurementId}/cancel", "Hủy phiên chờ đo");
endpoint("patch", "/measurements/{measurementId}/context", "Bối cảnh lúc đo", contextSchema);
endpoint("get", "/recommendations", "Gợi ý theo quy tắc, chưa tích hợp LLM");
endpoint("get", "/activity/{day}", "Hoạt động theo ngày");
endpoint("put", "/activity/{day}", "Nhập hoạt động", activitySchema);
endpoint("get", "/weather", "Thời tiết từ Open-Meteo");

export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "HealthAI TypeScript API",
    version: "1.0.0",
    description:
      "Node.js + Express + PostgreSQL. Đăng ký/đăng nhập lấy accessToken rồi dùng Authorize. Gợi ý dùng logic quy tắc; LLM sẽ tích hợp sau.",
  },
  paths,
  components: {
    securitySchemes: {
      BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      DeviceKey: { type: "apiKey", in: "header", name: "X-Device-Key" },
    },
  },
};
