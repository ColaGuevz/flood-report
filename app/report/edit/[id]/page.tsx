"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSeverityConfig, type Severity } from "@/app/components/SeverityBadge";
import { type ReportStatus, getStatusConfig } from "@/app/components/StatusBadge";

export default function EditReport() {
  const params = useParams();
  const router = useRouter();

  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("moderate");
  const [status, setStatus] = useState<ReportStatus>("active");
  const [imageUrl, setImageUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPost = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: post, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error || !post) {
        setError("Flood report not found.");
        setLoading(false);
        return;
      }

      // Make sure the user owns this post
      if (post.user_id !== user.id) {
        setError("You are not allowed to edit this report.");
        setLoading(false);
        return;
      }

      setLocation(post.location);
      setDescription(post.description);
      setSeverity((post.severity as Severity) ?? "moderate");
      setStatus((post.status as ReportStatus) ?? "active");
      setImageUrl(post.image_url);
      setLoading(false);
    };

    loadPost();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("posts")
      .update({
        location: location.trim(),
        description: description.trim(),
        severity,
        status,
      })
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#0b1120] flex items-center justify-center p-6 transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading flood report...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] py-10 px-4 sm:px-6 flex flex-col justify-center transition-colors duration-200">
      <div className="max-w-xl mx-auto w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Feed</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 p-6 sm:p-10 transition-colors duration-200">
          <div className="flex items-center gap-3.5 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shadow-inner">
              ✏️
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Edit Flood Report
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Update location details or description for this report.
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-sm rounded-2xl">
              {error}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* Photo preview (read-only) */}
              {imageUrl && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Attached Photo
                  </label>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 max-h-56">
                    <img
                      src={imageUrl}
                      alt="Current flood photo"
                      className="w-full h-full max-h-56 object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Location */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Location / Barangay / City <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-2xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  What's happening? <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                  className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none shadow-2xs leading-relaxed"
                />
              </div>

              {/* Flood Severity */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                  Flood Severity <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {([
                    { value: "minor", label: "Minor" },
                    { value: "moderate", label: "Moderate" },
                    { value: "severe", label: "Severe" },
                    { value: "critical", label: "Critical / Impassable" },
                  ] as { value: Severity; label: string }[]).map(({ value, label }) => {
                    const config = getSeverityConfig(value);
                    const isSelected = severity === value;
                    return (
                      <label
                        key={value}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all duration-100 select-none ${
                          isSelected
                            ? `${config.bg} ${config.border} ${config.text} shadow-xs`
                            : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750"
                        }`}
                      >
                        <input
                          type="radio"
                          name="severity"
                          value={value}
                          checked={isSelected}
                          onChange={() => setSeverity(value)}
                          className="sr-only"
                        />
                        <span className="text-base leading-none">{config.emoji}</span>
                        <span className="text-sm font-bold">{label}</span>
                        {isSelected && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4 ml-auto shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Flood Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                  Flood Status <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {([
                    { value: "active", label: "Flooding Active", subtitle: "Water level is elevated / impassable" },
                    { value: "resolved", label: "Flooding Resolved", subtitle: "Water has subsided / clear" },
                  ] as { value: ReportStatus; label: string; subtitle: string }[]).map(({ value, label, subtitle }) => {
                    const config = getStatusConfig(value);
                    const isSelected = status === value;
                    return (
                      <label
                        key={value}
                        className={`flex items-start gap-3 px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all duration-100 select-none ${
                          isSelected
                            ? `${config.bg} ${config.border} ${config.text} shadow-xs`
                            : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750"
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={value}
                          checked={isSelected}
                          onChange={() => setStatus(value)}
                          className="sr-only"
                        />
                        <span className="text-base leading-none mt-0.5">{config.emoji}</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold">{label}</p>
                          <p className="text-[11px] opacity-75 mt-0.5">{subtitle}</p>
                        </div>
                        {isSelected && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4 ml-auto shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-blue-600/25 hover:shadow-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {saving ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Saving Changes...
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
  );
}