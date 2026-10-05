import { MapPin, Droplets, Sun, Wind } from "lucide-react";
import type { WeatherData } from "@/types/health";

interface WeatherCardProps {
  weather: WeatherData;
  compact?: boolean;
}

function aqiLabel(aqi: number) {
  if (aqi <= 50) return { text: "Tốt", class: "text-primary-700 bg-primary-50" };
  if (aqi <= 100) return { text: "Trung bình", class: "text-warning-600 bg-warning-50" };
  return { text: "Kém", class: "text-danger-600 bg-danger-50" };
}

export default function WeatherCard({ weather, compact = false }: WeatherCardProps) {
  const aqi = aqiLabel(weather.aqi);

  return (
    <div className={`rounded-xl2 bg-surface p-6 shadow-card ${compact ? "" : "lg:col-span-2"}`}>
      <h3 className="mb-4 text-base font-semibold text-ink-900">Môi trường hôm nay</h3>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink-500">
          <MapPin size={15} className="text-ink-300" />
          {weather.location}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${aqi.class}`}>
          AQI {weather.aqi} · {aqi.text}
        </span>
      </div>

      <p className="mt-4 text-sm text-ink-500">Nhiệt độ</p>
      <p className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink-900">
        {weather.temperatureC}°C
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-xl bg-canvas py-3">
          <Droplets size={16} className="text-primary-700" />
          <span className="text-sm font-semibold text-ink-900">{weather.humidityPercent}%</span>
          <span className="text-xs text-ink-300">Độ ẩm</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl bg-canvas py-3">
          <Sun size={16} className="text-ink-500" />
          <span className="text-sm font-semibold text-ink-900">{weather.uvIndex}</span>
          <span className="text-xs text-ink-300">Chỉ số UV</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl bg-canvas py-3">
          <Wind size={16} className="text-ink-500" />
          <span className="text-sm font-semibold text-ink-900">{weather.aqi}</span>
          <span className="text-xs text-ink-300">AQI</span>
        </div>
      </div>
    </div>
  );
}
