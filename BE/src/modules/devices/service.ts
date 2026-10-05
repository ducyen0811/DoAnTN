import { type Device } from "@prisma/client";
import { DEVICE_HEARTBEAT_TIMEOUT_MS } from "../../constants.js";

export type DeviceRow = Device;
export const deviceView = (d: DeviceRow) => ({
  id: d.id,
  name: d.name,
  model: d.model,
  status:
    d.enabled && d.last_seen && Date.now() - d.last_seen.getTime() < DEVICE_HEARTBEAT_TIMEOUT_MS
      ? "connected"
      : "disconnected",
  lastUpdated: d.last_seen?.toISOString() ?? "Chưa kết nối",
  batteryPercent: d.battery,
  enabled: d.enabled,
});
