"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ReportStatus } from "./StatusBadge";

interface ToggleStatusButtonProps {
  postId: string;
  currentStatus: ReportStatus | string | null | undefined;
  userId: string;
  onStatusChange?: (newStatus: ReportStatus) => void;
}

export default function ToggleStatusButton({
  postId,
  currentStatus,
  userId,
  onStatusChange,
}: ToggleStatusButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isResolved = currentStatus === "resolved";
  const nextStatus: ReportStatus = isResolved ? "active" : "resolved";

  const handleToggle = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("posts")
        .update({ status: nextStatus })
        .eq("id", postId)
        .eq("user_id", userId);

      if (error) {
        throw new Error(error.message);
      }

      onStatusChange?.(nextStatus);
      router.refresh();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status. Please make sure you are logged in as the report owner.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 border ${
        isResolved
          ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
      }`}
      title={isResolved ? "Mark report as active again" : "Mark report as resolved / water subsided"}
    >
      {loading ? (
        <svg
          className="animate-spin h-3.5 w-3.5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : isResolved ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5 text-rose-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5 text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
      <span>{isResolved ? "Mark as Active" : "Mark as Resolved"}</span>
    </button>
  );
}
