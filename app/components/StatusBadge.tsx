export type ReportStatus = "active" | "resolved";

const STATUS_CONFIG: Record<
  ReportStatus,
  { emoji: string; label: string; bg: string; text: string; border: string; dotColor: string }
> = {
  active: {
    emoji: "🔴",
    label: "Flooding Active",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/60",
    dotColor: "bg-rose-500",
  },
  resolved: {
    emoji: "🟢",
    label: "Flooding Resolved",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
    dotColor: "bg-emerald-500",
  },
};

export function getStatusConfig(status: string | null | undefined) {
  const key = (status === "resolved" ? "resolved" : "active") as ReportStatus;
  return STATUS_CONFIG[key];
}

interface StatusBadgeProps {
  status: ReportStatus | string | null | undefined;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border transition-colors ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${status !== "resolved" ? "animate-pulse" : ""}`}></span>
      <span>{config.label}</span>
    </span>
  );
}
