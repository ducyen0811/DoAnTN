import WeatherCard from "@/components/WeatherCard";
import AIRecommendation from "@/components/AIRecommendation";
import { mockWeather } from "@/data/mockHealthData";

export default function WeatherAI() {
  return <div className="space-y-5">
    <p className="text-sm text-ink-500">Thời tiết đang dùng dữ liệu mẫu. Gợi ý thay đổi theo phiên đo mô phỏng và bối cảnh bạn cung cấp.</p>
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
      <WeatherCard weather={mockWeather} compact />
      <div id="ai" className="scroll-mt-24 lg:col-span-2"><AIRecommendation /></div>
    </div>
  </div>;
}
