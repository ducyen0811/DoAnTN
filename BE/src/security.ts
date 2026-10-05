import { createHash, randomBytes } from "node:crypto";

export const digest = (value: string) => createHash("sha256").update(value).digest("hex");
export const secret = () => randomBytes(48).toString("base64url");
