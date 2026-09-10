export default function RecentBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shrink-0 select-none"
      title="Posted within the last 24 hours"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
      RECENT (24H)
    </span>
  );
}
