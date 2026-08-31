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

  // If the report is resolved, we just show the static count without interactions.
  // We can choose to show it as disabled, or just the text.
  // The requirement says: "Resolved reports should not allow new confirmations."
  
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
      <div className="flex flex-col items-center gap-1 sm:items-start mt-4 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed">
          <span>👍</span>
          <span>Still Flooding</span>
        </div>
        {confirmCount > 0 && (
          <span className="text-xs text-slate-500 font-medium px-1">
            {confirmCount} {confirmCount === 1 ? "person" : "people"} confirmed this report
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5 mt-4 border-t border-slate-100 pt-3">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${
          hasConfirmed
            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 border border-blue-600"
            : "bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300"
        } ${(isPending) ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={hasConfirmed ? "drop-shadow-sm" : "grayscale opacity-70"}>👍</span>
        <span>{hasConfirmed ? "Confirmed" : "Still Flooding"}</span>
      </button>
      
      {confirmCount > 0 && (
        <span className="text-xs text-slate-500 font-medium px-1">
          {confirmCount} {confirmCount === 1 ? "person" : "people"} confirmed this report
        </span>
      )}
    </div>
  );
}
