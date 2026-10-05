import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  legend?: { label: string; colorClass: string }[];
  children: ReactNode;
}

export default function ChartCard({ title, subtitle, legend, children }: ChartCardProps) {
  return (
    <div className="rounded-xl2 bg-surface p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold text-ink-900">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-ink-300">{subtitle}</p>}
        </div>
        {legend && (
          <div className="flex items-center gap-4">
            {legend.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5 text-xs text-ink-500">
                <span className={`h-2 w-2 rounded-full ${item.colorClass}`} />
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 h-64 w-full">{children}</div>
    </div>
  );
}
