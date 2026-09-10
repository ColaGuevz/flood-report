"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSeverityConfig, type Severity } from "@/app/components/SeverityBadge";
import { useToast } from "@/app/components/Toast";

export default function NewReport() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("moderate");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReview, setShowReview] = useState(false);

  const handleImageChange = (file: File | null) => {
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size exceeds 10MB limit. Please choose a smaller photo.");
        return;
      }
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError("");
    } else {
      setImage(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    }
  };

  const handleRemoveImage = () => {
    handleImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    if (!image) {
      setError("Please attach a photograph of the flooding as visual evidence.");
      setLoading(false);
      return;
    }

    if (!location.trim()) {
      setError("Please specify the exact location or barangay.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Get the logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to broadcast a report.");
        setLoading(false);
        return;
      }

      // Create unique filename
      const fileExtension = image.name.split(".").pop() || "jpg";
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExtension}`;

      // Upload image
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(fileName, image);

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      // Get public image URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("post-images").getPublicUrl(fileName);

      // Create post in Supabase
      const { error: postError } = await supabase.from("posts").insert({
        user_id: user.id,
        location: location.trim(),
        description: description.trim(),
        severity,
        status: "active",
        image_url: publicUrl,
      });

      if (postError) {
        setError(postError.message);
        setLoading(false);
        return;
      }

      toast({
        type: "success",
        title: "Report Broadcasted",
        message: "Your flood hazard alert is now live for the community.",
      });

      // Redirect home
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const severityOptions: { value: Severity; label: string; desc: string }[] = [
    { value: "minor", label: "Minor", desc: "Ankle-deep • Passable to all vehicles" },
    { value: "moderate", label: "Moderate", desc: "Knee-deep • Caution for sedans & motorcycles" },
    { value: "severe", label: "Severe", desc: "Waist-deep • Impassable to light vehicles" },
    { value: "critical", label: "Critical", desc: "Chest-deep or higher • High danger / Evacuation" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090e17] py-8 sm:py-12 px-4 sm:px-6 flex flex-col justify-center transition-colors duration-150">
      <div className="max-w-2xl mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/"
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
            <span>Cancel & Return to Feed</span>
          </Link>

          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Incident Form
          </span>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          {/* Header */}
          <div className="pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-lg">
                📢
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Submit Flood Hazard Report
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Broadcast verified street conditions to alert motorists and local responders.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Section 1: Location */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Incident Location / Barangay <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                  placeholder="e.g., McArthur Highway, Brgy. San Agustin, Malolos, Bulacan"
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Specify street name, landmark, barangay, and municipality for quick location mapping.
              </p>
            </div>

            {/* Section 2: Severity Level Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Water Level & Severity Assessment <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {severityOptions.map(({ value, label, desc }) => {
                  const config = getSeverityConfig(value);
                  const isSelected = severity === value;
                  return (
                    <label
                      key={value}
                      className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-colors select-none ${
                        isSelected
                          ? `${config.bg} ${config.border} border-2 shadow-xs`
                          : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
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
                        {isSelected && (
                          <span className="text-blue-700 dark:text-blue-400 text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-6 leading-snug">
                        {desc}
                      </p>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Situation Observations */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                3. Situation & Road Conditions <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe current water depth, road passability, current weather conditions, or any stranded vehicles/motorists..."
                rows={3}
                required
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-3 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-blue-600 dark:focus:border-blue-500 resize-none leading-relaxed"
              />
            </div>

            {/* Section 4: Visual Evidence Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                4. Photo Evidence <span className="text-rose-500">*</span>
              </label>

              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-850/60 rounded-xl p-6 text-center cursor-pointer transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                    required
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Click to select or capture photo
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    JPG, PNG, or WEBP (Max 10MB)
                  </p>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 space-y-2">
                  <div className="relative aspect-[16/9] w-full bg-slate-950">
                    <img
                      src={previewUrl}
                      alt="Flood preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-rose-600 text-white text-xs font-semibold shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      Change Photo
                    </button>
                  </div>
                  {image && (
                    <div className="p-2.5 text-[11px] text-slate-300 flex items-center justify-between">
                      <span className="truncate max-w-xs">{image.name}</span>
                      <span>{(image.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Review Preview Toggle */}
            {location && description && previewUrl && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowReview(!showReview)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <span>{showReview ? "▲ Hide Broadcast Preview" : "▼ Review Report Before Submitting"}</span>
                </button>

                {showReview && (
                  <div className="mt-3 p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
                    <p className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                      Public Feed Preview
                    </p>
                    <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          📍 {location}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Just now
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/"
                className="flex-1 py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="flex-2 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-3.5 w-3.5 text-white"
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
                    <span>Broadcasting Report...</span>
                  </>
                ) : (
                  <span>Broadcast Flood Report →</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}