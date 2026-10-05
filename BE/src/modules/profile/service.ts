import { type User } from "@prisma/client";
import { type Database } from "../../db.js";
import { ApiError } from "../../errors.js";
import { profileSchema, type Profile } from "./schemas.js";
import { weightSchema } from "../weights/schemas.js";

type ProfileRecord = Pick<User, "id" | "email" | "profile" | "next_check_in">;
export type UserRow = Omit<ProfileRecord, "profile"> & { profile: Profile };
const storedProfileSchema = profileSchema.extend({ weightKg: weightSchema.shape.weight });
export const userView = (u: ProfileRecord): UserRow => ({
  id: u.id,
  email: u.email,
  next_check_in: u.next_check_in,
  profile: storedProfileSchema.parse(u.profile),
});
export const profileView = (u: UserRow) => ({ ...u.profile, id: u.id, email: u.email });
export async function getUser(db: Database, userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      profile: true,
      next_check_in: true,
    },
  });
  if (!user) throw new ApiError(401, "Tài khoản không tồn tại");
  return userView(user);
}
