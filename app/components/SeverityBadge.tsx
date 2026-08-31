// Shared severity badge — pure display component, no "use client" needed.

export type Severity = "minor" | "moderate" | "severe" | "critical";

const SEVERITY_CONFIG: Record<
  Severity,
  { emoji: string; label: string; bg: string; text: string; border: string }
> = {
  minor: {
    emoji: "🟢",
    label: "Minor",
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-200",
  },
  moderate: {
    emoji: "🟡",
    label: "Moderate",
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    border: "border-yellow-200",
  },
  severe: {
    emoji: "🟠",
    label: "Severe",
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-200",
  },
  critical: {
    emoji: "🔴",
    label: "Critical / Impassable",
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
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
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}
