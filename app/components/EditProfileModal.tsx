"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getProfileCooldownInfo, ProfileCooldownInfo } from "@/lib/date";
import { updateProfile } from "@/app/profile/actions";

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
  const [successMessage, setSuccessMessage] = useState("");
  
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null | undefined>(
    initialProfile.profile_last_updated_at
  );

  const router = useRouter();

  const cooldown: ProfileCooldownInfo = getProfileCooldownInfo(lastUpdatedAt, 60);

  const handleOpen = () => {
    setDisplayName(initialProfile.display_name || "");
    setUsername(initialProfile.username || "");
    setError("");
    setSuccessMessage("");
    setIsOpen(true);
  };

  const handleClose = () => {
    if (loading) return;
    setIsOpen(false);
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cooldown.canEdit) {
      setError(cooldown.message);
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

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

      setSuccessMessage(res.message || "Profile updated successfully!");
      if (res.profile_last_updated_at) {
        setLastUpdatedAt(res.profile_last_updated_at);
      }

      router.refresh();

      setTimeout(() => {
        setLoading(false);
        setIsOpen(false);
      }, 1000);
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
        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer shadow-2xs border bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 border-slate-200 hover:border-slate-300 dark:border-slate-700/80 dark:hover:border-slate-600"
        aria-label="Edit Profile"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
          >
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg shadow-inner">
                  👤
                </div>
                <div>
                  <h3
                    id="edit-profile-title"
                    className="text-base font-bold text-slate-900 dark:text-white"
                  >
                    Edit Profile
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    Update your public handle & display name
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Cooldown Notice if locked */}
              {!cooldown.canEdit ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200 text-sm">
                      <span>🔒</span>
                      <span>Profile Editing Locked</span>
                    </div>
                    <p className="leading-relaxed">
                      {cooldown.message}
                    </p>
                    {cooldown.nextEligibleDate && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                        Next eligible date:{" "}
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

                  <div className="space-y-3 opacity-60">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        disabled
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                        Username
                      </label>
                      <input
                        type="text"
                        value={`@${username}`}
                        disabled
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer border border-transparent dark:border-slate-700"
                    >
                      Understood
                    </button>
                  </div>
                </div>
              ) : (
                /* Eligible Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Important 60-day rule reminder */}
                  <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/60 text-blue-900 dark:text-blue-300 rounded-xl p-3 text-xs flex items-start gap-2">
                    <span className="text-base shrink-0">ℹ️</span>
                    <p className="leading-snug">
                      <strong>60-day policy:</strong> You can only change your username and display name <strong>once every 60 days</strong>.
                    </p>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label
                      htmlFor="edit-displayName"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Display Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="edit-displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Juan dela Cruz"
                      required
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-2xs"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label
                      htmlFor="edit-username"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 text-sm font-semibold">
                        @
                      </span>
                      <input
                        id="edit-username"
                        type="text"
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
                        }
                        placeholder="juandelacruz"
                        required
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 pl-8 pr-4 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-2xs"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-400">
                      Letters, numbers, and underscores only. Min 3 characters.
                    </p>
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 rounded-xl p-3 text-xs font-medium flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Success Alert */}
                  {successMessage && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 rounded-xl p-3 text-xs font-medium flex items-center gap-2">
                      <span>✅</span>
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs"
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-white"
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
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
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
