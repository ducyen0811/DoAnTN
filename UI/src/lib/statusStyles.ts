import type { VitalStatus } from "@/types/health";

export const statusStyles: Record<
  VitalStatus,
  { text: string; bg: string; dot: string; label: string }
> = {
  normal: {
    text: "text-primary-700",
    bg: "bg-primary-50",
    dot: "bg-primary-500",
    label: "Bình thường",
  },
  warning: {
    text: "text-warning-600",
    bg: "bg-warning-50",
    dot: "bg-warning-500",
    label: "Cần chú ý",
  },
  danger: {
    text: "text-danger-600",
    bg: "bg-danger-50",
    dot: "bg-danger-500",
    label: "Nguy hiểm",
  },
};
