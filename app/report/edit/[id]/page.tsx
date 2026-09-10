"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSeverityConfig, type Severity } from "@/app/components/SeverityBadge";
import { type ReportStatus, getStatusConfig } from "@/app/components/StatusBadge";
import { useToast } from "@/app/components/Toast";

export default function EditReport() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

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
        setError("You are not authorized to edit this report.");
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

    toast({
      type: "success",
      title: "Report Updated",
      message: "Flood report details saved successfully.",
    });

    router.push(`/report/${params.id}`);
    router.refresh();
  };

  const severityOptions: { value: Severity; label: string; desc: string }[] = [
    { value: "minor", label: "Minor", desc: "Ankle-deep • Passable to all vehicles" },
    { value: "moderate", label: "Moderate", desc: "Knee-deep • Caution for light vehicles" },
    { value: "severe", label: "Severe", desc: "Waist-deep • Impassable to light vehicles" },
    { value: "critical", label: "Critical", desc: "Chest-deep or higher • Danger / Evacuation" },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#090e17] flex items-center justify-center p-6 transition-colors duration-150">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading hazard report...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090e17] py-8 sm:py-12 px-4 sm:px-6 flex flex-col justify-center transition-colors duration-150">
      <div className="max-w-xl mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-5">
          <Link
            href={`/report/${params.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
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
            <span>Back to Report Details</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          <div className="pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-lg">
                ✏️
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Update Flood Report
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Revise location details, severity assessment, or hazard status.
                </p>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
              {error}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Photo preview (read-only) */}
              {imageUrl && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Attached Photo Evidence
                  </label>
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 aspect-[16/9] w-full">
                    <img
                      src={imageUrl}
                      alt="Current flood photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Location / Barangay <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 outline-none transition focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Situation & Road Conditions <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-3 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 outline-none transition focus:border-blue-600 dark:focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              {/* Severity Level */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Severity Level <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {severityOptions.map(({ value, label, desc }) => {
                    const config = getSeverityConfig(value);
                    const isSelected = severity === value;
                    return (
                      <label
                        key={value}
                        className={`flex flex-col p-2.5 rounded-xl border cursor-pointer select-none transition-colors ${
                          isSelected
                            ? `${config.bg} ${config.border} border-2`
                            : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="severity"
                            value={value}
                            checked={isSelected}
                            onChange={() => setSeverity(value)}
                            className="sr-only"
                          />
                          <span className="text-sm">{config.emoji}</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 pl-6 leading-tight">
                          {desc}
                        </p>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Flood Status <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([
                    { value: "active", label: "Flooding Active", subtitle: "Water level is elevated / impassable" },
                    { value: "resolved", label: "Flooding Resolved", subtitle: "Water has receded / clear road" },
                  ] as { value: ReportStatus; label: string; subtitle: string }[]).map(({ value, label, subtitle }) => {
                    const config = getStatusConfig(value);
                    const isSelected = status === value;
                    return (
                      <label
                        key={value}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-colors ${
                          isSelected
                            ? `${config.bg} ${config.border} border-2`
                            : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300"
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
                        <span className="text-sm mt-0.5">{config.emoji}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{label}</p>
                          <p className="text-[10px] opacity-75">{subtitle}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <Link
                  href={`/report/${params.id}`}
                  className="flex-1 py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-2 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}