import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useHealthSession } from "@/context/HealthSession";

export default function BMIHistory() {
  const { data } = useHealthSession();
  if (!data) return null;
  const history = data.entries.map(entry => ({
    date: new Date(entry.recordedAt).toLocaleDateString("vi-VN"),
    bmi: Number(entry.bmi.toFixed(1)),
    recordedAt: entry.recordedAt,
  }));
  return (
    <section className="min-w-0 rounded-xl2 bg-surface p-6 shadow-card" aria-labelledby="bmi-history-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="bmi-history-title" className="text-base font-semibold">BMI theo tuần</h2>
          <p className="mt-1 text-sm text-ink-500">Các lần cập nhật cân nặng · kg/m²</p>
        </div>
        <Link to="/health-tracking" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-700">
          Lịch sử <ArrowUpRight aria-hidden="true" size={16} />
        </Link>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-ink-500">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary-700" /> BMI
      </p>
      {history.length === 1 && <p className="mt-2 text-sm text-ink-500">Đã lưu mốc đầu tiên. Xu hướng sẽ xuất hiện sau các lần cập nhật hằng tuần.</p>}
      <div className="mt-4 h-56" role="img" aria-label="Biểu đồ lịch sử BMI. Các giá trị có trong bảng dữ liệu bên dưới.">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 12, right: 40, bottom: 8, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} minTickGap={32} tick={{ fontSize: 12, fill: "#526571" }} />
            <YAxis width={40} domain={["dataMin - 1", "dataMax + 1"]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#526571" }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 14 }} formatter={(value: number) => [`${value} kg/m²`, "BMI"]} />
            <Line type="monotone" dataKey="bmi" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-primary)" }} activeDot={{ r: 6 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 border-t border-ink-900/10 pt-3">
        <summary className="flex min-h-11 items-center text-sm font-medium text-primary-700">Xem dữ liệu BMI</summary>
        <table className="mt-2 w-full text-left text-sm">
          <caption className="sr-only">Lịch sử BMI hằng tuần</caption>
          <thead><tr><th scope="col" className="py-2 font-medium text-ink-500">Ngày cập nhật</th><th scope="col" className="py-2 text-right font-medium text-ink-500">BMI (kg/m²)</th></tr></thead>
          <tbody>{history.map(entry => <tr key={entry.recordedAt} className="border-t border-ink-900/5"><td className="py-2">{entry.date}</td><td className="py-2 text-right tabular-nums">{entry.bmi.toFixed(1)}</td></tr>)}</tbody>
        </table>
      </details>
    </section>
  );
}
