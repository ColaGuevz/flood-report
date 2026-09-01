// Shared severity badge — pure display component, no "use client" needed.

export type Severity = "minor" | "moderate" | "severe" | "critical";

const SEVERITY_CONFIG: Record<
  Severity,
  { emoji: string; label: string; bg: string; text: string; border: string }
> = {
  minor: {
    emoji: "🟢",
    label: "Minor",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
  },
  moderate: {
    emoji: "🟡",
    label: "Moderate",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/60",
  },
  severe: {
    emoji: "🟠",
    label: "Severe",
    bg: "bg-orange-50 dark:bg-orange-950/50",
    text: "text-orange-800 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800/60",
  },
  critical: {
    emoji: "🔴",
    label: "Critical / Impassable",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-800 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/60",
  },
};

export function getSeverityConfig(severity: string | null) {
  const key = (severity ?? "moderate") as Severity;
  return SEVERITY_CONFIG[key] ?? SEVERITY_CONFIG.moderate;
}

interface SeverityBadgeProps {
  severity: string | null;
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = getSeverityConfig(severity);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border backdrop-blur-xs transition-colors shadow-2xs ${config.bg} ${config.text} ${config.border}`}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}
