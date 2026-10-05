import type { LucideIcon } from "lucide-react";
interface SensorCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  accentClass?: string;
}
export default function SensorCard({
  icon: Icon,
  label,
  value,
  unit,
  accentClass = "bg-primary-50 text-primary-700",
}: SensorCardProps) {
  return (
    <div className="flex min-h-[160px] sm:min-h-[205px] flex-col rounded-xl2 bg-surface p-6 shadow-card">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accentClass}`}
        >
          <Icon aria-hidden="true" size={21} strokeWidth={1.8} />
        </span>
        <p className="text-sm font-medium text-ink-500">{label}</p>
      </div>
      <div className="my-auto py-4">
        <p className="text-4xl font-semibold tracking-tight text-ink-900 tabular-nums">
          {value}
          {unit && (
            <span className="ml-2 text-sm font-medium tracking-normal text-ink-500">{unit}</span>
          )}
        </p>
      </div>
      <p className="border-t border-ink-900/5 pt-3 text-xs text-ink-500">
        {value === "—" ? "Chưa có kết quả đo" : "Kết quả của phiên đo hiện tại"}
      </p>
    </div>
  );
}
