import { HeartPulse, Activity, ArrowUpRight, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import BMIHistory from "@/components/BMIHistory";
import BMICard from "@/components/BMICard";
import SensorCard from "@/components/SensorCard";
import { useMeasurement } from "@/context/Measurement";
import ActivityCard from "@/components/ActivityCard";
import WeatherCard from "@/components/WeatherCard";
import AIRecommendation from "@/components/AIRecommendation";
import WeeklyCheckIn from "@/components/WeeklyCheckIn";
import { useHealthSession } from "@/context/HealthSession";
import { calculateBmi } from "@/lib/healthProfile";
import { mockActivity, mockWeather } from "@/data/mockHealthData";

export default function Dashboard() {
  const { data } = useHealthSession();
  const { reading, stale } = useMeasurement();
  if (!data) return null;
  return (
    <div className="space-y-7">
      <section className="py-1">
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold tracking-tight text-ink-900">
              Chào {data.profile.fullName}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              {data.profile.weightKg} kg · {data.profile.heightCm} cm · {data.entries.length} lần cập nhật cân nặng
            </p>
          </div>
          <Link
            to="/sensors"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            <HeartPulse size={18} />
            Đo chỉ số
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <section aria-labelledby="metrics-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="metrics-heading" className="text-base font-bold">
              Chỉ số của bạn
            </h2>
            <p className="mt-1 text-sm text-ink-500">BMI từ hồ sơ và kết quả phiên đo gần nhất.</p>
          </div>
          <span className="text-xs text-ink-500">
            Cảm biến & vận động: dữ liệu mẫu
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <BMICard bmi={calculateBmi(data.profile.weightKg, data.profile.heightCm)} />
          <SensorCard
            icon={HeartPulse}
            label="Nhịp tim"
            value={reading?.heartRate ?? "—"}
            unit="BPM"
            accentClass="bg-primary-50 text-primary-700"
          />
          <SensorCard
            icon={Activity}
            label="Nồng độ oxy · SpO₂"
            value={reading?.spo2 ?? "—"}
            unit="%"
            accentClass="bg-primary-50 text-primary-700"
          />
          <ActivityCard activity={mockActivity} />
        </div>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-500">
          <Radio size={14} className="mt-0.5 shrink-0" />
          {reading
            ? `Lần đo mô phỏng: ${new Date(reading.measuredAt).toLocaleString("vi-VN")}${stale ? " · Đã cũ, cần đo lại" : ""}`
            : "Chưa có số đo nhịp tim và SpO₂. Bắt đầu một phiên đo để xem kết quả."}
        </p>
      </section>
      <section aria-label="Theo dõi BMI hằng tuần" className="grid items-start gap-5 xl:grid-cols-[1.5fr_1fr]">
        <BMIHistory />
        <WeeklyCheckIn />
      </section>
      <section aria-labelledby="daily-heading" className="space-y-4">
        <div>
          <h2 id="daily-heading" className="text-base font-bold">
            Môi trường & gợi ý
          </h2>
          <p className="mt-1 text-xs text-ink-500">
            Thời tiết mẫu và gợi ý theo phiên đo mô phỏng.
          </p>
        </div>
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-4">
          <WeatherCard weather={mockWeather} />
          <AIRecommendation />
        </div>
      </section>
    </div>
  );
}
