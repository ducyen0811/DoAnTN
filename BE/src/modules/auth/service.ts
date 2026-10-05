import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { SignJWT } from "jose";
import type { Database } from "../../db.js";
import { config } from "../../config.js";
import { digest, secret } from "../../security.js";
import { jwtKey, jwtIssuer, jwtAudience } from "./jwt.js";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(encoded)) return false;
  const [salt, hash] = encoded.split(":");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}
const dummyHash = hashPassword(secret());
export async function checkPassword(password: string, hash?: string) {
  return verifyPassword(password, hash ?? (await dummyHash));
}
export async function issueSession(db: Database, userId: string) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + config.SESSION_HOURS * 3600;
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setJti(secret())
    .setIssuer(jwtIssuer)
    .setAudience(jwtAudience)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(jwtKey);
  const session = await db.authSession.create({
    data: {
      token_hash: digest(token),
      user_id: userId,
      expires_at: new Date(expiresAt * 1000),
    },
  });
  return { accessToken: token, tokenType: "bearer", expiresAt: session.expires_at };
}
