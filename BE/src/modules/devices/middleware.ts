import { type Request } from "express";
import { timingSafeEqual } from "node:crypto";
import { type Database } from "../../db.js";
import { ApiError } from "../../errors.js";
import { digest } from "../../security.js";
import { idParam } from "../../shared/http.js";

export async function authenticateDevice(db: Database, req: Request) {
  const id = idParam(req, "deviceId");
  const device = await db.device.findUnique({ where: { id } });
  const supplied = Buffer.from(digest(req.get("X-Device-Key") ?? ""), "hex");
  if (
    !device ||
    !device.enabled ||
    !timingSafeEqual(Buffer.from(device.key_hash, "hex"), supplied)
  ) {
    throw new ApiError(401, "Khóa thiết bị không hợp lệ");
  }
  return device;
}
