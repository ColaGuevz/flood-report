"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getProfileCooldownInfo, ProfileCooldownInfo } from "@/lib/date";
import { updateProfile } from "@/app/profile/actions";
import { useToast } from "./Toast";

interface EditProfileModalProps {
  initialProfile: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string | null;
    profile_last_updated_at?: string | null;
  };
}

export default function EditProfileModal({ initialProfile }: EditProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState(initialProfile.display_name || "");
  const [username, setUsername] = useState(initialProfile.username || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null | undefined>(
    initialProfile.profile_last_updated_at
  );

  const router = useRouter();
  const cooldown: ProfileCooldownInfo = getProfileCooldownInfo(lastUpdatedAt, 60);

  const handleOpen = () => {
    setDisplayName(initialProfile.display_name || "");
    setUsername(initialProfile.username || "");
    setError("");
    setIsOpen(true);
  };

  const handleClose = () => {
    if (loading) return;
    setIsOpen(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cooldown.canEdit) {
      setError(cooldown.message);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await updateProfile({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
      });

      if (!res.success) {
        setError(res.error || "Failed to update profile.");
        setLoading(false);
        return;
      }

      if (res.profile_last_updated_at) {
        setLastUpdatedAt(res.profile_last_updated_at);
      }

      toast({
        type: "success",
        title: "Profile Saved",
        message: res.message || "Your citizen details were updated.",
      });

      router.refresh();
      setLoading(false);
      setIsOpen(false);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Edit Profile Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 border-slate-300 dark:border-slate-700"
        aria-label="Edit Profile"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
        <span>Edit Profile</span>
      </button>

      {/* Modal Backdrop & Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Edit Citizen Identity
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Update your public display name & username handle
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5">
              {!cooldown.canEdit ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 rounded-xl p-3.5 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>🔒</span>
                      <span>Profile Editing Locked</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {cooldown.message}
                    </p>
                    {cooldown.nextEligibleDate && (
                      <p className="text-[10px] text-amber-800 dark:text-amber-400 pt-1 border-t border-amber-200 dark:border-amber-800">
                        Next update available:{" "}
                        <strong>
                          {cooldown.nextEligibleDate.toLocaleDateString(undefined, {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </strong>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-colors"
                  >
                    Understood
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Cooldown reminder */}
                  <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 text-blue-900 dark:text-blue-300 rounded-xl p-3 text-xs leading-relaxed">
                    <strong>Civic Accountability Policy:</strong> You can only update your display name and username <strong>once every 60 days</strong>.
                  </div>

                  {/* Display Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Display Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Juan dela Cruz"
                      required
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 outline-none transition focus:border-blue-600 dark:focus:border-blue-500"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                        @
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
                        }
                        placeholder="juandelacruz"
                        required
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 pl-8 pr-3.5 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 outline-none transition focus:border-blue-600 dark:focus:border-blue-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Letters, numbers, and underscores only. Min 3 characters.
                    </p>
                  </div>

                  {error && (
                    <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg p-2.5 text-xs font-semibold">
                      ⚠️ {error}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-colors disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Identity"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
