import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import ModerationDashboard from "./components/ModerationDashboard";
import { Profile, PostWithAuthor, UserRole } from "@/lib/types";

export const metadata = {
  title: "Moderation Queue & Administration — FloodWatch",
  description: "Official moderator dashboard for verifying, moderating, and managing community flood hazard reports.",
};

export default async function ModerationPage() {
  const supabase = await createClient();

  // 1. Authenticate Viewer
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch Viewer Profile with Role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/profile/setup");
  }

  const userRole = (profile.role as UserRole) || "user";
  const isAuthorized = userRole === "moderator" || userRole === "admin";

  // 3. Unauthorized State Handling (403 Access Denied)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090e17] flex flex-col font-sans transition-colors duration-150">
        <Navbar profile={profile} />

        <main className="flex-1 max-w-lg w-full mx-auto px-4 py-16 flex items-center justify-center">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl mx-auto border border-rose-200 dark:border-rose-900">
              🛡️
            </div>

            <div className="space-y-1.5">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Access Restricted: Moderator Area
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                The FloodWatch moderation and incident management console is restricted to designated community moderators and emergency operations staff.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <p>
                Signed in as: <strong>@{profile.username}</strong> ({profile.display_name})
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Current Role: <span className="font-semibold uppercase text-slate-500">{userRole}</span>
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <Link
                href="/"
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white transition-colors text-center"
              >
                Return to Public Feed
              </Link>
              <Link
                href="/profile"
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors text-center"
              >
                View My Profile
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 4. Authorized Access: Fetch reports for moderation queue
  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles (
        username,
        display_name,
        avatar_url,
        role
      ),
      report_confirmations (
        user_id
      )
    `)
    .order("created_at", { ascending: false });

  // 5. If Admin: Fetch all profiles for user role management
  let allProfiles: Profile[] = [];
  if (userRole === "admin") {
    const { data: profilesList } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    allProfiles = (profilesList as Profile[]) || [];
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090e17] flex flex-col font-sans transition-colors duration-150">
      <Navbar profile={profile} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
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
            <span>Back to Live Community Feed</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <span>🛡️ FloodWatch Incident Moderation Operations</span>
          </div>
        </div>

        {/* Dashboard Component */}
        <ModerationDashboard
          initialPosts={(posts as PostWithAuthor[]) || []}
          allProfiles={allProfiles}
          currentProfile={profile as Profile}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] py-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <p>© {new Date().getFullYear()} FloodWatch Incident Operations • Authorized Staff Console</p>
        </div>
      </footer>
    </div>
  );
}
