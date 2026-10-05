import type { LucideIcon } from "lucide-react";
import type { VitalStatus } from "@/types/health";
import { statusStyles } from "@/lib/statusStyles";

interface HealthCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  unit?: string;
  status: VitalStatus;
  helperText?: string;
}

export default function HealthCard({
  icon: Icon,
  label,
  value,
  unit,
  status,
  helperText,
}: HealthCardProps) {
  const styles = statusStyles[status];

  return (
    <div className="flex flex-col justify-between rounded-xl2 bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.bg}`}>
          <Icon size={19} strokeWidth={2.2} className={styles.text} />
        </div>
        <span className={`flex items-center gap-1.5 rounded-full ${styles.bg} px-2.5 py-1 text-xs font-medium ${styles.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
          {styles.label}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink-900">
          {value}
          {unit && <span className="ml-1 text-base font-medium text-ink-500">{unit}</span>}
        </p>
        {helperText && <p className="mt-1.5 text-xs text-ink-300">{helperText}</p>}
      </div>
    </div>
  );
}
