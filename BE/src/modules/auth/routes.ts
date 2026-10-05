import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { WEIGHT_CHECK_IN_MS } from "../../constants.js";
import { prisma, transaction, readSnapshot } from "../../db.js";
import { ApiError } from "../../errors.js";
import { bmi, sessionView } from "../weights/service.js";
import { getUser, userView } from "../profile/service.js";
import { authenticate } from "./middleware.js";
import { checkPassword, hashPassword, issueSession } from "./service.js";
import * as s from "./schemas.js";

export const authRouter = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { detail: "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau." },
});

authRouter.post("/register", authLimiter, async (req, res) => {
  const { email, password, ...profile } = s.registerSchema.parse(req.body);
  const passwordHash = await hashPassword(password);
  const result = await transaction(async (db) => {
    const user = userView(
      await db.user.create({
        data: {
          email,
          password_hash: passwordHash,
          profile,
          next_check_in: new Date(Date.now() + WEIGHT_CHECK_IN_MS),
        },
      }),
    );
    await db.weightEntry.create({
      data: {
        user_id: user.id,
        weight: profile.weightKg,
        bmi: bmi(profile.weightKg, profile.heightCm).value,
      },
    });
    return { ...(await issueSession(db, user.id)), data: await sessionView(db, user) };
  });
  res.status(201).json(result);
});
authRouter.post("/login", authLimiter, async (req, res) => {
  const { email, password } = s.loginSchema.parse(req.body);
  const record = await prisma.user.findUnique({ where: { email } });
  const user = record ? userView(record) : null;
  const valid = await checkPassword(password, record?.password_hash);
  if (!user || !valid) throw new ApiError(401, "Email hoặc mật khẩu không đúng");
  res.json(
    await transaction(async (db) => ({
      ...(await issueSession(db, user.id)),
      data: await sessionView(db, user),
    })),
  );
});

authRouter.post("/logout", authenticate, async (_req, res) => {
  await prisma.authSession.deleteMany({ where: { token_hash: res.locals.tokenHash } });
  res.sendStatus(204);
});
authRouter.get("/me", authenticate, async (_req, res) => {
  res.json(await readSnapshot(async (db) => sessionView(db, await getUser(db, res.locals.userId))));
});
