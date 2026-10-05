import type {
  UserProfile,
  VitalReading,
  BmiInfo,
  WeightLogEntry,
  SensorDevice,
  SensorReadings,
  ActivitySummary,
  WeatherData,
  AiRecommendation,
  AiWorkoutSuggestion,
} from "@/types/health";

// ---------------------------------------------------------------------------
// This file stands in for future API responses (FastAPI + PostgreSQL).
// Every export here is shaped exactly like the payload a real endpoint
// would return, so swapping mock imports for fetch calls later is a
// mechanical change, not a redesign.
// ---------------------------------------------------------------------------

export const mockUserProfile: UserProfile = {
  id: "usr_001",
  fullName: "Nguyen Duc Yen",
  email: "ssw0811@gmail.com",
  age: 24,
  gender: "male",
  heightCm: 172,
  weightKg: 66.5,
  activityLevel: "moderate",
};

export const mockBmi: BmiInfo = {
  value: 22.5,
  status: "normal",
  minHealthy: 18.5,
  maxHealthy: 24.9,
};

export const mockVitals: VitalReading[] = [
  {
    label: "Heart Rate",
    value: 76,
    unit: "BPM",
    status: "normal",
    updatedAt: new Date().toISOString(),
  },
  {
    label: "SpO2",
    value: 98,
    unit: "%",
    status: "normal",
    updatedAt: new Date().toISOString(),
  },
];

export const mockActivity: ActivitySummary = {
  steps: 6500,
  stepGoal: 10000,
  caloriesKcal: 450,
  calorieGoal: 700,
  activeMinutes: 38,
};

export const mockWeightHistory: WeightLogEntry[] = [
  { date: "01/01", weight: 70, bmi: 24 },
  { date: "01/02", weight: 68, bmi: 23 },
  { date: "01/03", weight: 68.5, bmi: 23.2 },
  { date: "01/04", weight: 67.8, bmi: 22.9 },
  { date: "01/05", weight: 67.2, bmi: 22.7 },
  { date: "01/06", weight: 67, bmi: 22.6 },
  { date: "01/07", weight: 66.5, bmi: 22.5 },
];

export const mockSensorDevice: SensorDevice = {
  id: "dev_esp32_01",
  name: "ESP32 Health Sensor",
  model: "ESP32-WROOM-32 + MAX30102",
  status: "connected",
  lastUpdated: "10 seconds ago",
  batteryPercent: 82,
};

export const mockSensorReadings: SensorReadings = {
  heartRateBpm: 76,
  spo2Percent: 98,
  temperatureC: 30,
  humidityPercent: 70,
  movement: "active",
};

export const mockWeather: WeatherData = {
  location: "Ho Chi Minh City",
  temperatureC: 36,
  humidityPercent: 75,
  uvIndex: 8,
  aqi: 95,
  condition: "sunny",
};

export const mockAiRecommendation: AiRecommendation = {
  id: "ai_rec_001",
  headline: "Điều kiện hiện tại phù hợp với vận động nhẹ",
  detail:
    "Nhiệt độ và chỉ số UV ở mức cao vào giữa ngày. Cơ thể bạn đang ở trạng thái ổn định, phù hợp cho các hoạt động cường độ thấp đến trung bình.",
  tips: [
    "Uống đủ nước, khoảng 2–2.5 lít mỗi ngày",
    "Hạn chế tập ngoài trời khi UV ở mức cao (11h–15h)",
    "Duy trì vận động 30 phút mỗi ngày",
  ],
  riskLevel: "warning",
  generatedAt: new Date().toISOString(),
};

export const mockWorkoutSuggestions: AiWorkoutSuggestion[] = [
  {
    title: "Morning workout",
    description: "Tập luyện ngoài trời lúc 6h–8h khi nhiệt độ và UV còn thấp.",
    bestTimeWindow: "06:00 – 08:00",
    icon: "sunrise",
  },
  {
    title: "Indoor exercise",
    description: "Chuyển sang bài tập trong nhà nếu không thể tập buổi sáng.",
    bestTimeWindow: "Cả ngày",
    icon: "home",
  },
];
