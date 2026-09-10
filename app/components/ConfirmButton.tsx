"use client";

import { useState, useTransition } from "react";
import { toggleConfirmation } from "@/app/actions/confirm";
import { useToast } from "./Toast";

interface ConfirmButtonProps {
  postId: string;
  initialHasConfirmed: boolean;
  initialConfirmCount: number;
  isResolved: boolean;
  isLoggedIn?: boolean;
}

export default function ConfirmButton({
  postId,
  initialHasConfirmed,
  initialConfirmCount,
  isResolved,
  isLoggedIn = true,
}: ConfirmButtonProps) {
  const [hasConfirmed, setHasConfirmed] = useState(initialHasConfirmed);
  const [confirmCount, setConfirmCount] = useState(initialConfirmCount);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleToggle = async () => {
    if (isResolved || isPending) return;

    if (!isLoggedIn) {
      if (
        confirm(
          "You must be logged in to confirm flood reports. Would you like to sign in now?"
        )
      ) {
        window.location.href = "/login";
      }
      return;
    }

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
        toast({
          type: "error",
          title: "Confirmation Error",
          message: result.error || "Failed to update confirmation",
        });
      } else {
        toast({
          type: "success",
          title: !previousHasConfirmed ? "Report Confirmed" : "Confirmation Removed",
          message: !previousHasConfirmed
            ? "Thank you for verifying this flood report."
            : "Your confirmation has been removed.",
        });
      }
    });
  };

  if (isResolved) {
    return (
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed select-none">
          <span>✓</span>
          <span>Resolved</span>
        </div>
        {confirmCount > 0 && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {confirmCount} verified
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
          hasConfirmed
            ? "bg-blue-700 text-white border-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:border-blue-600 dark:hover:bg-blue-500 shadow-xs"
            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-400 dark:hover:border-slate-600"
        } ${isPending ? "opacity-70 cursor-not-allowed" : "cursor-pointer active:scale-95"}`}
        title={hasConfirmed ? "Click to remove confirmation" : "Verify that flooding is still ongoing here"}
      >
        <span>{hasConfirmed ? "✓" : "👍"}</span>
        <span>{hasConfirmed ? "Confirmed Flooding" : "Verify Still Flooding"}</span>
      </button>

      {confirmCount > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
          {confirmCount} {confirmCount === 1 ? "confirmation" : "confirmations"}
        </span>
      )}
    </div>
  );
}
