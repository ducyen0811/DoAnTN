import { Router } from "express";
import { prisma, transaction } from "../../db.js";
import { userId } from "../../shared/http.js";
import { getUser, userView, profileView } from "./service.js";
import { profileSchema } from "./schemas.js";

export const router = Router();

router.get("/profile", async (_req, res) => {
  res.json(profileView(await getUser(prisma, userId(res))));
});
router.put("/profile", async (req, res) => {
  const fields = profileSchema.parse(req.body);
  res.json(
    await transaction(async (db) => {
      const u = await getUser(db, userId(res));
      return profileView(
        userView(
          await db.user.update({
            where: { id: u.id },
            data: { profile: { ...u.profile, ...fields } },
          }),
        ),
      );
    }),
  );
});
