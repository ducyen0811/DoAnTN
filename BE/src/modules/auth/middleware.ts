import type { RequestHandler } from "express";
import { jwtVerify } from "jose";
import { prisma } from "../../db.js";
import { ApiError } from "../../errors.js";
import { uuidSchema } from "../../schemas.js";
import { digest } from "../../security.js";
import { jwtKey, jwtIssuer, jwtAudience } from "./jwt.js";

export const authenticate: RequestHandler = async (req, res, next) => {
  const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(
    req.headers.authorization ?? "",
  );
  if (!match) throw new ApiError(401, "Vui lòng đăng nhập");
  let subject: string;
  try {
    const { payload } = await jwtVerify(match[1], jwtKey, {
      algorithms: ["HS256"],
      issuer: jwtIssuer,
      audience: jwtAudience,
      typ: "JWT",
      requiredClaims: ["sub", "jti", "iat", "exp", "iss", "aud"],
    });
    subject = uuidSchema.parse(payload.sub);
    if (typeof payload.jti !== "string" || !payload.jti) throw new Error("Invalid token ID");
  } catch {
    throw new ApiError(401, "JWT không hợp lệ hoặc đã hết hạn");
  }
  const tokenHash = digest(match[1]);
  const session = await prisma.authSession.findFirst({
    where: { token_hash: tokenHash, user_id: subject, expires_at: { gt: new Date() } },
    select: { user_id: true },
  });
  if (!session) throw new ApiError(401, "Phiên đăng nhập đã hết hạn hoặc không hợp lệ");
  res.locals.userId = session.user_id;
  res.locals.tokenHash = tokenHash;
  next();
};
