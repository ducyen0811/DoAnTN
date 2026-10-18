import type { BmiInfo, UserProfile } from "@/types/health";

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const healthGoals = {
  maintain: "Duy trì sức khỏe",
  lose: "Giảm cân",
  gain: "Tăng cân",
  heart: "Theo dõi và cải thiện nhịp tim",
  fitness: "Cải thiện thể lực",
} as const;

export type PersonalProfile = UserProfile & { healthGoal: keyof typeof healthGoals };
export interface WeightEntry { recordedAt: string; weight: number; bmi: number }

export function calculateBmi(weight: number, height: number): BmiInfo {
  const value = weight / (height / 100) ** 2;
  return {
    value,
    status: value < 18.5 ? "underweight" : value < 25 ? "normal" : value < 30 ? "overweight" : "obese",
    minHealthy: 18.5,
    maxHealthy: 24.9,
  };
}

export function nextCheckIn(entries: WeightEntry[]) {
  return new Date(new Date(entries[entries.length - 1].recordedAt).getTime() + WEEK_MS);
}
