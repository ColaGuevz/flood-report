import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "./components/Navbar";
import FeedList from "./components/FeedList";

export default async function Home() {
  const supabase = await createClient();

  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in, send user to login
  if (!user) {
    redirect("/login");
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // If profile doesn't exist, send user to profile setup
  if (!profile) {
    redirect("/profile/setup");
  }

  // Get flood reports
  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      profiles (
        username,
        display_name,
        avatar_url
      ),
      report_confirmations (
        user_id
      )
    `
    )
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] flex flex-col font-sans transition-colors duration-200">
      {/* Sticky Top Navigation */}
      <Navbar profile={profile} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Welcome / Community Action Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 dark:from-blue-900 dark:via-indigo-950 dark:to-slate-900 text-white shadow-xl shadow-blue-700/10 dark:shadow-black/40 p-6 sm:p-8 border border-blue-500/20 dark:border-slate-800">
          {/* Decorative background blurs */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 dark:bg-blue-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-sky-400/20 dark:bg-cyan-500/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 dark:bg-white/10 backdrop-blur-sm text-blue-100 dark:text-blue-200 border border-white/20 dark:border-white/10 shadow-2xs">
                <span>🛡️ Community Safety Network</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {profile.display_name}!
              </h2>
              <p className="text-sm sm:text-base text-blue-100/90 dark:text-slate-300 max-w-lg leading-relaxed">
                Stay alert with live community flood updates. Share what’s happening in your street to keep everyone safe.
              </p>
            </div>

            <Link
              href="/report/new"
              className="inline-flex items-center justify-center gap-2 self-start sm:self-auto shrink-0 bg-white text-blue-700 hover:bg-blue-50 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500 font-bold px-5 py-3.5 rounded-2xl shadow-lg shadow-black/10 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-blue-600 dark:text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Report Flooding</span>
            </Link>
          </div>
        </section>

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-3xl p-5 flex items-start gap-3 shadow-xs">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="font-semibold text-sm">Failed to load reports</h4>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                Please refresh the page or try again in a few moments.
              </p>
            </div>
          </div>
        )}

        {/* Interactive Feed with Real-time Search & Severity Filters */}
        {!error && (
          <FeedList
            posts={posts || []}
            currentUserId={user.id}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b1120] py-6 text-center text-xs text-slate-400 dark:text-slate-400 mt-12 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4">
          <p>© {new Date().getFullYear()} FloodWatch — Community Crowdsourced Safety Network</p>
        </div>
      </footer>
    </div>
  );
}