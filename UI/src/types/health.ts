// Domain types shared across the app.
// Designed to map 1:1 onto a future FastAPI + PostgreSQL schema.

export type Gender = "male" | "female" | "other";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
}

export type VitalStatus = "normal" | "warning" | "danger";

export interface VitalReading {
  label: string;
  value: number;
  unit: string;
  status: VitalStatus;
  updatedAt: string; // ISO timestamp
}

export interface BmiInfo {
  value: number;
  status: "underweight" | "normal" | "overweight" | "obese";
  minHealthy: number;
  maxHealthy: number;
}

export interface WeightLogEntry {
  date: string; // display label, e.g. "01/01"
  weight: number;
  bmi: number;
}

export type SensorConnectionStatus = "connected" | "disconnected" | "syncing";

export interface SensorDevice {
  id: string;
  name: string;
  model: string;
  status: SensorConnectionStatus;
  lastUpdated: string; // human readable, e.g. "10 seconds ago"
  batteryPercent: number;
}

export interface SensorReadings {
  heartRateBpm: number;
  spo2Percent: number;
  temperatureC: number;
  humidityPercent: number;
  movement: "resting" | "active" | "sleeping";
}

export interface ActivitySummary {
  steps: number;
  stepGoal: number;
  caloriesKcal: number;
  calorieGoal: number;
  activeMinutes: number;
}

export interface WeatherData {
  location: string;
  temperatureC: number;
  humidityPercent: number;
  uvIndex: number;
  aqi: number;
  condition: "sunny" | "cloudy" | "rainy" | "clear";
}

export interface AiRecommendation {
  id: string;
  headline: string;
  detail: string;
  tips: string[];
  riskLevel: VitalStatus;
  generatedAt: string;
}

export interface AiWorkoutSuggestion {
  title: string;
  description: string;
  bestTimeWindow: string;
  icon: "sunrise" | "home";
}
