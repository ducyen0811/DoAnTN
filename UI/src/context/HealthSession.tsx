import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { calculateBmi, healthGoals, nextCheckIn, type PersonalProfile, type WeightEntry } from "@/lib/healthProfile";

interface SessionData {
  profile: PersonalProfile;
  entries: WeightEntry[];
}
interface SessionContext {
  data: SessionData | null;
  signedIn: boolean;
  signIn: (email: string) => boolean;
  completeProfile: (profile: PersonalProfile) => void;
  setHealthGoal: (goal: PersonalProfile["healthGoal"]) => void;
  saveWeight: (weight: number) => boolean;
  signOut: () => void;
}
const Context = createContext<SessionContext | null>(null);

const STORAGE_KEY = "healthai.demo-session.v1";
function profileKey(email: string) { return `${STORAGE_KEY}.profile.${encodeURIComponent(email.trim().toLowerCase())}`; }
function readSession(key = STORAGE_KEY): { data: SessionData | null; signedIn: boolean } {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
    const profile = saved?.data?.profile;
    const entries = saved?.data?.entries;
    if (profile && typeof profile.fullName === "string" && typeof profile.email === "string"
      && Number.isFinite(profile.age) && profile.age >= 18 && profile.age <= 120
      && Number.isFinite(profile.heightCm) && profile.heightCm >= 100 && profile.heightCm <= 250
      && Number.isFinite(profile.weightKg) && profile.weightKg >= 20 && profile.weightKg <= 300
      && ["male", "female", "other"].includes(profile.gender)
      && ["sedentary", "light", "moderate", "active", "very_active"].includes(profile.activityLevel)
      && Object.prototype.hasOwnProperty.call(healthGoals, profile.healthGoal)
      && Array.isArray(entries) && entries.length > 0
      && entries.every(entry => Number.isFinite(Date.parse(entry.recordedAt)) && Number.isFinite(entry.weight) && entry.weight >= 20 && entry.weight <= 300 && Number.isFinite(entry.bmi))) {
      return { data: saved.data, signedIn: saved.signedIn === true };
    }
  } catch { /* Invalid or unavailable storage starts a fresh demo. */ }
  return { data: null, signedIn: false };
}

// UI prototype only: tab-local storage is not authentication. Never store passwords.
export function HealthSessionProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readSession);
  const [data, setData] = useState<SessionData | null>(initial.data);
  const [signedIn, setSignedIn] = useState(initial.signedIn);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ data, signedIn }));
      if (data) sessionStorage.setItem(profileKey(data.profile.email), JSON.stringify({ data, signedIn: false }));
      setStorageError(false);
    } catch { setStorageError(true); }
  }, [data, signedIn]);

  function completeProfile(profile: PersonalProfile) {
    setData({ profile, entries: [{ recordedAt: new Date().toISOString(), weight: profile.weightKg, bmi: calculateBmi(profile.weightKg, profile.heightCm).value }] });
    setSignedIn(true);
  }

  function saveWeight(weight: number) {
    if (!data || !Number.isFinite(weight) || weight < 20 || weight > 300 || Date.now() < nextCheckIn(data.entries).getTime()) return false;
    setData({
      profile: { ...data.profile, weightKg: weight },
      entries: [...data.entries, { recordedAt: new Date().toISOString(), weight, bmi: calculateBmi(weight, data.profile.heightCm).value }],
    });
    return true;
  }

  return <Context.Provider value={{ data, signedIn, completeProfile, saveWeight,
    setHealthGoal(goal) {
      if (data && Object.prototype.hasOwnProperty.call(healthGoals, goal)) setData({ ...data, profile: { ...data.profile, healthGoal: goal } });
    },
    signIn(email) {
      const matches = data?.profile.email.toLowerCase() === email.trim().toLowerCase();
      if (matches) { setSignedIn(true); return true; }
      const saved = readSession(profileKey(email));
      if (saved.data) { setData(saved.data); setSignedIn(true); return true; }
      return false;
    },
    signOut() { setSignedIn(false); },
  }}>{storageError && <p role="alert" className="bg-warning-50 px-4 py-3 text-sm text-ink-900">Trình duyệt không cho phép lưu phiên. Dữ liệu trải nghiệm sẽ mất khi tải lại trang.</p>}{children}</Context.Provider>;
}

export function useHealthSession() {
  const context = useContext(Context);
  if (!context) throw new Error("HealthSessionProvider is required");
  return context;
}
