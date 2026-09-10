"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/Toast";

export default function ProfileSetup() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        username: username.trim().toLowerCase(),
        display_name: displayName.trim(),
        avatar_url: user.user_metadata?.avatar_url || null,
      });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      toast({
        type: "success",
        title: "Account Setup Complete",
        message: "Welcome to the FloodWatch Community Safety Network.",
      });

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to setup profile.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#090e17] flex items-center justify-center px-4 sm:px-6 py-12 transition-colors duration-150">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center text-xl font-bold mx-auto">
              👤
            </div>

            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Complete Citizen Identity
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Establish your verified profile before broadcasting or confirming community hazard alerts.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="displayName"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Full Display Name <span className="text-rose-500">*</span>
              </label>

              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Juan dela Cruz"
                required
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-blue-600 dark:focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="username"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Username Handle <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
                  }
                  placeholder="juandelacruz"
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 pl-8 pr-3.5 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <p className="text-[10px] text-slate-400">
                Letters, numbers, and underscores only.
              </p>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg p-2.5 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              {loading ? "Saving Profile..." : "Complete Setup & Enter Portal →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}