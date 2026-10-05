import type { BmiInfo } from "@/types/health";

interface BMICardProps {
  bmi: BmiInfo;
}

const statusLabel: Record<BmiInfo["status"], string> = {
  underweight: "Thiếu cân",
  normal: "Bình thường",
  overweight: "Thừa cân",
  obese: "Béo phì",
};

const statusColor = {
  underweight: { badge: "bg-primary-500/10 text-accent-600", stroke: "#2557C7" },
  normal: { badge: "bg-primary-50 text-primary-700", stroke: "var(--color-primary)" },
  overweight: { badge: "bg-warning-50 text-warning-600", stroke: "#D9780A" },
  obese: { badge: "bg-danger-50 text-danger-600", stroke: "#C82D33" },
};

// BMI clinical range used to position the gauge, from underweight to obese.
const SCALE_MIN = 15;
const SCALE_MAX = 32;

export default function BMICard({ bmi }: BMICardProps) {
  const color = statusColor[bmi.status];
  const radius = 72;
  const circumference = Math.PI * radius; // half circle
  const clamped = Math.min(Math.max(bmi.value, SCALE_MIN), SCALE_MAX);
  const progress = (clamped - SCALE_MIN) / (SCALE_MAX - SCALE_MIN);
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex min-h-[205px] flex-col rounded-xl2 bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-500">Chỉ số BMI</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${color.badge}`}>
          {statusLabel[bmi.status]}
        </span>
      </div>

      <div className="relative mx-auto mt-2 h-[104px] w-[160px]">
        <svg aria-hidden="true" viewBox="0 0 160 90" className="h-full w-full overflow-visible">
          <path
            d="M 8 84 A 72 72 0 0 1 152 84"
            fill="none"
            stroke="#EEF3F6"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 8 84 A 72 72 0 0 1 152 84"
            fill="none"
            stroke={color.stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="font-display text-3xl font-semibold tracking-tight text-ink-900">
            {bmi.value.toFixed(1)}
          </span>
          <span className="text-xs text-ink-300">kg/m²</span>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-ink-300">
        Khoảng khỏe mạnh: {bmi.minHealthy}–{bmi.maxHealthy}
      </p>
    </div>
  );
}
