import { type Database } from "../../db.js";
import { profileView, type UserRow } from "../profile/service.js";

export const bmi = (weight: number, height: number) => {
  const value = weight / (height / 100) ** 2;
  return {
    value,
    status:
      value < 18.5 ? "underweight" : value < 25 ? "normal" : value < 30 ? "overweight" : "obese",
    minHealthy: 18.5,
    maxHealthy: 24.9,
  };
};
export async function sessionView(db: Database, u: UserRow) {
  const rows = await db.weightEntry.findMany({
    where: { user_id: u.id },
    orderBy: [{ recorded_at: "asc" }, { id: "asc" }],
    select: { recorded_at: true, weight: true, bmi: true },
  });
  return {
    profile: profileView(u),
    entries: rows.map((e) => ({ recordedAt: e.recorded_at, weight: e.weight, bmi: e.bmi })),
    nextCheckInAt: u.next_check_in,
  };
}
