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

  // Get publicly visible flood reports (supports 'visible' or null fallback)
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
    .or("moderation_status.eq.visible,moderation_status.is.null")
    .order("created_at", { ascending: false });

  // Calculate quick stats
  const activeCount = posts?.filter((p) => p.status !== "resolved").length || 0;
  const criticalCount = posts?.filter((p) => p.severity === "critical" && p.status !== "resolved").length || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090e17] flex flex-col font-sans transition-colors duration-150">
      {/* Sticky Top Navigation */}
      <Navbar profile={profile} />

      {/* Main Content Container with Desktop Grid Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Civic Emergency Operations Banner */}
        <section
          aria-label="Civic Emergency Overview"
          className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <span>🛡️ Community Disaster Risk Intelligence</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Welcome, {profile.display_name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Crowdsourced street-level flood intelligence. Check local road conditions and broadcast real-time hazard alerts to keep your community safe.
              </p>
            </div>

            {/* Quick Operational Metrics */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0 flex-wrap">
              <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 min-w-28 text-center">
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeCount}
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Active Hazards
                </p>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 min-w-28 text-center">
                <p className="text-lg font-bold text-rose-700 dark:text-rose-400">
                  {criticalCount}
                </p>
                <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Critical Areas
                </p>
              </div>

              <Link
                href="/report/new"
                className="inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-3 rounded-xl shadow-xs transition-colors text-xs shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
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
          </div>
        </section>

        {/* Desktop 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Feed Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Error State */}
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <h4 className="font-semibold text-sm">Failed to load reports</h4>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                    Please refresh the page or check your connection.
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
          </div>

          {/* Civic Operations Sidebar (4 cols on Desktop, hidden on small screens) */}
          <aside aria-label="Emergency Guidelines" className="lg:col-span-4 space-y-5">
            {/* Severity Guidelines Card */}
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-sm">📐</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Severity Standards
                </h3>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="shrink-0 mt-0.5">🟢</span>
                  <div>
                    <strong className="text-slate-900 dark:text-white font-semibold">Minor:</strong> Ankle-deep (under 6 in). Passable to all vehicles.
                  </div>
                </li>
                <li className="flex items-start gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="shrink-0 mt-0.5">🟡</span>
                  <div>
                    <strong className="text-slate-900 dark:text-white font-semibold">Moderate:</strong> Knee-deep (6–18 in). Risky for sedans & motorcycles.
                  </div>
                </li>
                <li className="flex items-start gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="shrink-0 mt-0.5">🟠</span>
                  <div>
                    <strong className="text-slate-900 dark:text-white font-semibold">Severe:</strong> Waist-deep (18–36 in). Impassable to light vehicles.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">🔴</span>
                  <div>
                    <strong className="text-slate-900 dark:text-white font-semibold">Critical:</strong> Chest-deep or impassable. High danger / evacuation.
                  </div>
                </li>
              </ul>
            </div>

            {/* Emergency Hotlines Card */}
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-sm">🚨</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Emergency Hotlines
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">National Emergency</span>
                  <strong className="font-bold text-slate-900 dark:text-white">911</strong>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Philippine Red Cross</span>
                  <strong className="font-bold text-slate-900 dark:text-white">143 / (02) 8790-2300</strong>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">NDRRMC Disaster Hotline</span>
                  <strong className="font-bold text-slate-900 dark:text-white">(02) 8911-5061</strong>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Always contact local emergency response units (MDRRMO / BFP) for rescue assistance.
              </p>
            </div>

            {/* Verification Protocol Note */}
            <div className="bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/60 p-4 space-y-2 text-xs text-blue-950 dark:text-blue-300">
              <div className="flex items-center gap-1.5 font-bold">
                <span>🛡️</span>
                <span>Civic Verification Protocol</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-900/80 dark:text-blue-300/80">
                Confirm reports you have personally observed on the road. Community confirmations assist motorists and local responders in prioritizing relief.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Civic Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] py-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-12 transition-colors duration-150">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} FloodWatch — Community Flood Safety Network</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Information provided by civic community reports. In critical emergencies, call 911 immediately.
          </p>
        </div>
      </footer>
    </div>
  );
}