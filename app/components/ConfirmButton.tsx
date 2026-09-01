"use client";

import { useState, useTransition } from "react";
import { toggleConfirmation } from "@/app/actions/confirm";

interface ConfirmButtonProps {
  postId: string;
  initialHasConfirmed: boolean;
  initialConfirmCount: number;
  isResolved: boolean;
}

export default function ConfirmButton({
  postId,
  initialHasConfirmed,
  initialConfirmCount,
  isResolved,
}: ConfirmButtonProps) {
  const [hasConfirmed, setHasConfirmed] = useState(initialHasConfirmed);
  const [confirmCount, setConfirmCount] = useState(initialConfirmCount);
  const [isPending, startTransition] = useTransition();

  const handleToggle = async () => {
    if (isResolved || isPending) return;

    // Optimistic update
    const previousHasConfirmed = hasConfirmed;
    const previousCount = confirmCount;

    setHasConfirmed(!previousHasConfirmed);
    setConfirmCount(previousHasConfirmed ? previousCount - 1 : previousCount + 1);

    startTransition(async () => {
      const result = await toggleConfirmation(postId);
      if (!result.success) {
        // Revert on error
        setHasConfirmed(previousHasConfirmed);
        setConfirmCount(previousCount);
        alert(result.error || "Failed to update confirmation");
      }
    });
  };

  if (isResolved) {
    return (
      <div className="flex flex-col items-center gap-1 sm:items-start mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed select-none">
          <span>👍</span>
          <span>Still Flooding</span>
        </div>
        {confirmCount > 0 && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium px-1">
            {confirmCount} {confirmCount === 1 ? "person" : "people"} confirmed this report
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5 mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${
          hasConfirmed
            ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 dark:hover:bg-blue-600 border border-blue-600 dark:border-blue-500"
            : "bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600"
        } ${isPending ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={hasConfirmed ? "drop-shadow-sm" : "grayscale opacity-70"}>👍</span>
        <span>{hasConfirmed ? "Confirmed Flooding" : "Still Flooding"}</span>
      </button>
      
      {confirmCount > 0 && (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium px-1">
          {confirmCount} {confirmCount === 1 ? "person" : "people"} confirmed this report
        </span>
      )}
    </div>
  );
}
