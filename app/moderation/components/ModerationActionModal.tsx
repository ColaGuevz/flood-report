"use client";

import { useState } from "react";
import { moderateReport } from "@/app/actions/moderation";
import { useToast } from "@/app/components/Toast";
import { PostWithAuthor } from "@/lib/types";

interface ModerationActionModalProps {
  post: PostWithAuthor;
  action: "hide" | "remove" | "restore";
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPostId: string, nextStatus: string, reason: string) => void;
}

const QUICK_REASONS: Record<"hide" | "remove" | "restore", string[]> = {
  hide: [
    "Unverified or suspected inaccurate water level",
    "Duplicate or redundant road report",
    "Temporarily under citizen verification",
    "Low-quality / unidentifiable photo evidence",
  ],
  remove: [
    "Inappropriate or unrelated media upload",
    "Confirmed fake / misleading disaster alert",
    "Spam or promotional submission",
    "Severe violation of community reporting standards",
  ],
  restore: [
    "Information verified and confirmed accurate",
    "Photo evidence validated with local landmarks",
    "Report cleared by moderation review",
    "Restored upon author clarification",
  ],
};

export default function ModerationActionModal({
  post,
  action,
  isOpen,
  onClose,
  onSuccess,
}: ModerationActionModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  if (!isOpen) return null;

  const actionDetails = {
    hide: {
      title: "Hide Flood Report",
      subtitle: "This report will be hidden from the live public feed until restored.",
      buttonLabel: "Confirm & Hide Report",
      buttonColor: "bg-amber-600 hover:bg-amber-700 text-white",
      icon: "🔒",
      badgeColor: "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    },
    remove: {
      title: "Remove Flood Report",
      subtitle: "This report will be marked as removed for policy violations or false information.",
      buttonLabel: "Confirm & Remove Report",
      buttonColor: "bg-rose-600 hover:bg-rose-700 text-white",
      icon: "🚫",
      badgeColor: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    },
    restore: {
      title: "Restore Flood Report",
      subtitle: "This report will become publicly visible again on the community feed.",
      buttonLabel: "Confirm & Restore Report",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700 text-white",
      icon: "🔄",
      badgeColor: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    },
  }[action];

  const handleSelectQuickReason = (selected: string) => {
    setReason(selected);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReason = reason.trim();

    if (!cleanReason || cleanReason.length < 3) {
      setError("Please provide a moderation reason (minimum 3 characters).");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await moderateReport({
        reportId: post.id,
        action,
        reason: cleanReason,
      });

      if (!result.success) {
        setError(result.error || "Failed to complete moderation action.");
        setIsSubmitting(false);
        return;
      }

      toast({
        type: "success",
        title: "Moderation Complete",
        message: result.message || "Report updated successfully.",
      });

      const nextStatus =
        action === "hide" ? "hidden" : action === "remove" ? "removed" : "visible";

      onSuccess(post.id, nextStatus, cleanReason);
      onClose();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-left animate-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">
              {actionDetails.icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {actionDetails.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {actionDetails.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Target Post Context Summary */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white truncate">
              📍 {post.location}
            </span>
            <span className="text-[11px] text-slate-500 shrink-0 ml-2">
              ID: {post.id}
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 line-clamp-2">
            {post.description}
          </p>
          <p className="text-[11px] text-slate-400">
            Reported by: <strong>{post.profiles?.display_name || "Citizen"}</strong> (@{post.profiles?.username || "user"})
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Quick Reasons Chips */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Select Quick Reason
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS[action].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => handleSelectQuickReason(quick)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border text-left transition-colors cursor-pointer ${
                    reason === quick
                      ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 font-semibold"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {quick}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Moderation Reason & Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detail the specific rationale for this moderation action..."
              rows={3}
              required
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-3 text-xs sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 outline-none transition focus:border-blue-600 dark:focus:border-blue-500 resize-none leading-relaxed"
            />
            <p className="text-[11px] text-slate-400">
              This reason is recorded in the moderation audit log and helps maintain civic accountability.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${actionDetails.buttonColor}`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Action...</span>
                </>
              ) : (
                <span>{actionDetails.buttonLabel}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
