import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import ChartCard from "@/components/ChartCard";
import { useHealthSession } from "@/context/HealthSession";
import WeeklyCheckIn from "@/components/WeeklyCheckIn";

export default function HealthTracking() {
  const { data } = useHealthSession();
  if (!data) return null;
  const weightHistory = data.entries.map(entry => ({ date: new Date(entry.recordedAt).toLocaleDateString("vi-VN"), weight: entry.weight, bmi: Number(entry.bmi.toFixed(1)) }));
  return (
    <div className="flex flex-col gap-4">
      <WeeklyCheckIn />
      {weightHistory.length === 1 && <p className="text-sm text-ink-500">Đã lưu mốc cân nặng đầu tiên. Biểu đồ sẽ thể hiện xu hướng sau các lần cập nhật hằng tuần.</p>}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Cân nặng theo thời gian"
          subtitle="Các lần cập nhật hằng tuần"
          legend={[{ label: "Cân nặng (kg)", colorClass: "bg-primary-500" }]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightHistory} margin={{ left: -12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAFBF6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#5B6E68" }} axisLine={false} tickLine={false} />
              <YAxis
                domain={["dataMin - 1", "dataMax + 1"]}
                tick={{ fontSize: 12, fill: "#5B6E68" }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #EAFBF6", fontSize: 12 }}
                formatter={(value: number) => [`${value} kg`, "Cân nặng"]}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#0C9A6E"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#0C9A6E" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Chỉ số BMI theo thời gian"
          subtitle="Các lần cập nhật hằng tuần"
          legend={[{ label: "BMI", colorClass: "bg-accent-500" }]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightHistory} margin={{ left: -12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAF1FD" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#5B6E68" }} axisLine={false} tickLine={false} />
              <YAxis
                domain={["dataMin - 1", "dataMax + 1"]}
                tick={{ fontSize: 12, fill: "#5B6E68" }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #EAF1FD", fontSize: 12 }}
                formatter={(value: number) => [value, "BMI"]}
              />
              <Line
                type="monotone"
                dataKey="bmi"
                stroke="#2F6FED"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#2F6FED" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="overflow-hidden rounded-xl2 bg-surface shadow-card">
        <div className="border-b border-ink-900/5 px-5 py-4">
          <p className="font-display text-base font-semibold text-ink-900">Lịch sử đo</p>
        </div>
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-ink-300">
                <th className="px-5 py-3 font-medium">Ngày</th>
                <th className="px-5 py-3 font-medium">Cân nặng (kg)</th>
                <th className="px-5 py-3 font-medium">BMI</th>
              </tr>
            </thead>
            <tbody>
              {weightHistory.map((entry) => (
                <tr key={entry.date} className="border-t border-ink-900/5">
                  <td className="px-5 py-3 font-medium text-ink-900">{entry.date}</td>
                  <td className="px-5 py-3 text-ink-700">{entry.weight}</td>
                  <td className="px-5 py-3 text-ink-700">{entry.bmi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
