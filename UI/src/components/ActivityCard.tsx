import { Footprints, Flame } from "lucide-react";
import type { ActivitySummary } from "@/types/health";

interface ActivityCardProps {
  activity: ActivitySummary;
}

function ProgressRow({
  icon: Icon,
  label,
  value,
  goal,
  unit,
  colorClass,
}: {
  icon: typeof Footprints;
  label: string;
  value: number;
  goal: number;
  unit: string;
  colorClass: string;
}) {
  const pct = Math.min(100, Math.round((value / goal) * 100));
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
        <span className="flex items-center gap-2 font-medium text-ink-700">
          <Icon aria-hidden="true" size={16} className="text-ink-300" />
          {label}
        </span>
        <span className="whitespace-nowrap text-ink-500 tabular-nums">
          {value.toLocaleString("vi-VN")}
          <span className="text-ink-300"> / {goal.toLocaleString("vi-VN")} {unit}</span>
        </span>
      </div>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${value} / ${goal} ${unit}`} className="mt-2 h-2 w-full overflow-hidden rounded-full bg-canvas">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <div className="flex min-h-[205px] flex-col justify-center gap-5 rounded-xl2 bg-surface p-6 shadow-card">
      <p className="text-sm font-medium text-ink-500">Vận động hôm nay</p>
      <ProgressRow
        icon={Footprints}
        label="Số bước"
        value={activity.steps}
        goal={activity.stepGoal}
        unit="bước"
        colorClass="bg-primary-500"
      />
      <ProgressRow
        icon={Flame}
        label="Calo"
        value={activity.caloriesKcal}
        goal={activity.calorieGoal}
        unit="kcal"
        colorClass="bg-primary-700"
      />
    </div>
  );
}
