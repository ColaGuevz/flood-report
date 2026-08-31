export type ReportStatus = "active" | "resolved";

const STATUS_CONFIG: Record<
  ReportStatus,
  { emoji: string; label: string; bg: string; text: string; border: string }
> = {
  active: {
    emoji: "🔴",
    label: "Flooding Active",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  resolved: {
    emoji: "🟢",
    label: "Flooding Resolved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
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
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className="text-xs">{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}
