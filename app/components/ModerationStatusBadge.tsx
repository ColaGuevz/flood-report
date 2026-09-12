import { ModerationStatus } from "@/lib/types";

interface ModerationStatusBadgeProps {
  status?: ModerationStatus | string | null;
  showIcon?: boolean;
}

const MODERATION_CONFIG: Record<
  ModerationStatus,
  { label: string; emoji: string; bg: string; text: string; border: string; dotColor: string }
> = {
  visible: {
    label: "Public / Visible",
    emoji: "👁️",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
    dotColor: "bg-emerald-500",
  },
  hidden: {
    label: "Temporarily Hidden",
    emoji: "🔒",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/60",
    dotColor: "bg-amber-500",
  },
  removed: {
    label: "Removed from Public",
    emoji: "🚫",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/60",
    dotColor: "bg-rose-500",
  },
};

export function getModerationConfig(status?: string | null) {
  if (status === "hidden") return MODERATION_CONFIG.hidden;
  if (status === "removed") return MODERATION_CONFIG.removed;
  return MODERATION_CONFIG.visible;
}

export default function ModerationStatusBadge({
  status,
  showIcon = true,
}: ModerationStatusBadgeProps) {
  const config = getModerationConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wide border transition-colors ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`}></span>
      {showIcon && <span className="text-[11px]">{config.emoji}</span>}
      <span>{config.label}</span>
    </span>
  );
}
