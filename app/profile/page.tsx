import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import DeletePostButton from "@/app/components/DeletePostButton";
import SeverityBadge from "@/app/components/SeverityBadge";
import StatusBadge from "@/app/components/StatusBadge";
import ModerationStatusBadge from "@/app/components/ModerationStatusBadge";
import ToggleStatusButton from "@/app/components/ToggleStatusButton";
import RecentBadge from "@/app/components/RecentBadge";
import EditProfileModal from "@/app/components/EditProfileModal";
import ConfirmButton from "@/app/components/ConfirmButton";
import { formatRelativeTime, isRecent, getProfileCooldownInfo } from "@/lib/date";

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get the currently authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/profile/setup");
  }

  // Calculate 60-day profile edit cooldown
  const cooldown = getProfileCooldownInfo(profile.profile_last_updated_at, 60);

  // Get only this user's flood reports, newest first
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      *,
      report_confirmations (
        user_id
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const reportCount = posts?.length ?? 0;
  const activeReports = posts?.filter((p) => p.status !== "resolved").length ?? 0;
  const resolvedReports = posts?.filter((p) => p.status === "resolved").length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090e17] flex flex-col font-sans transition-colors duration-150">
      {/* Shared Navbar */}
      <Navbar profile={profile} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
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
            <span>Back to Live Feed</span>
          </Link>
        </div>

        {/* Citizen Profile Card */}
        <section className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Subtle Civic Header Banner */}
          <div className="h-24 sm:h-28 bg-slate-800 dark:bg-slate-900 border-b border-slate-700/60 p-4 sm:p-6 flex items-start justify-between text-white">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              Verified Citizen Profile
            </span>
            <span className="text-xs text-slate-400">
              ID: {user.id.slice(0, 8)}...
            </span>
          </div>

          {/* Profile Details Area */}
          <div className="px-5 sm:px-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 mb-4">
              {/* Avatar with clean ring */}
              <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-4 ring-white dark:ring-[#0f172a] bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-slate-700 dark:text-slate-300">
                    {profile.display_name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>

              {/* Action Controls & Edit button */}
              <div className="flex items-center gap-2.5">
                <EditProfileModal initialProfile={profile} />
                <Link
                  href="/report/new"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
                >
                  <span>+ New Report</span>
                </Link>
              </div>
            </div>

            {/* Profile Identity Details */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {profile.display_name}
                    </h1>
                    {profile.role === "admin" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        👑 Administrator
                      </span>
                    )}
                    {profile.role === "moderator" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        🛡️ Moderator
                      </span>
                    )}
                    {(!profile.role || profile.role === "user") && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        👤 Citizen Reporter
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    @{profile.username}
                  </p>
                </div>

                {(profile.role === "moderator" || profile.role === "admin") && (
                  <Link
                    href="/moderation"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors shrink-0"
                  >
                    <span>🛡️ Open Moderation Dashboard →</span>
                  </Link>
                )}
              </div>

              {/* Metric Stats Row */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {reportCount}
                  </p>
                  <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                    Total Reports
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-center">
                  <p className="text-lg font-bold text-rose-700 dark:text-rose-400">
                    {activeReports}
                  </p>
                  <p className="text-[10px] uppercase font-semibold text-rose-600 dark:text-rose-400 tracking-wider">
                    Active Hazards
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-center">
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {resolvedReports}
                  </p>
                  <p className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider">
                    Resolved
                  </p>
                </div>
              </div>

              {/* Cooldown Info Badge */}
              {!cooldown.canEdit && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <span>🔒</span>
                  <span>{cooldown.message}</span>
                </div>
              )}

              {/* Footer Meta */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-3 flex-wrap">
                {profile.created_at && (
                  <span>
                    Citizen reporter since {new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </span>
                )}
                {profile.profile_last_updated_at && (
                  <span>
                    • Profile updated {formatRelativeTime(profile.profile_last_updated_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Reports Section Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              My Submissions
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {reportCount}
            </span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl p-4 flex items-start gap-3">
            <span className="text-base">⚠️</span>
            <div className="text-xs">
              <h4 className="font-semibold">Failed to load reports</h4>
              <p className="mt-0.5 text-rose-600">Please refresh the page.</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && reportCount === 0 && (
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 text-center space-y-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-lg mx-auto">
              📭
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No reports submitted yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven&apos;t posted any flood reports. Help keep your community safe by reporting rising street water levels.
              </p>
            </div>
            <Link
              href="/report/new"
              className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <span>+ Create First Report</span>
            </Link>
          </div>
        )}

        {/* Reports List */}
        <div className="space-y-4">
          {posts?.map((post) => {
            const postDate = new Date(post.created_at);
            const reportDetailsUrl = `/report/${post.id}`;

            return (
              <article
                key={post.id}
                className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden"
              >
                <div className="p-4 sm:p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <Link
                        href={reportDetailsUrl}
                        className="inline-flex items-center gap-1.5 font-bold text-slate-900 dark:text-white hover:text-blue-600 text-sm tracking-tight"
                      >
                        <span className="text-rose-600">📍</span>
                        <span>{post.location}</span>
                      </Link>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <time dateTime={post.created_at} title={postDate.toLocaleString()}>
                          {formatRelativeTime(post.created_at)} ({postDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })})
                        </time>
                      </p>
                    </div>

                    {/* Owner controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <ToggleStatusButton
                        postId={post.id}
                        currentStatus={post.status}
                        userId={user.id}
                      />

                      <Link
                        href={`/report/edit/${post.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                        title="Edit report"
                      >
                        Edit
                      </Link>

                      <DeletePostButton
                        postId={post.id}
                        userId={user.id}
                      />
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <SeverityBadge severity={post.severity} />
                    <StatusBadge status={post.status} />
                    {post.moderation_status && post.moderation_status !== "visible" && (
                      <ModerationStatusBadge status={post.moderation_status} />
                    )}
                    {isRecent(post.created_at) && <RecentBadge />}
                  </div>

                  {/* Moderation notice for author */}
                  {post.moderation_status && post.moderation_status !== "visible" && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 space-y-0.5">
                      <p className="font-semibold flex items-center gap-1.5">
                        <span>🛡️ Moderation Status:</span>
                        <span className="capitalize">{post.moderation_status}</span>
                      </p>
                      {post.moderation_reason && (
                        <p className="text-[11px] opacity-90">
                          <strong>Note:</strong> {post.moderation_reason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <p className="mt-2.5 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {post.description}
                  </p>
                </div>

                {/* Photo Preview */}
                {post.image_url && (
                  <Link
                    href={reportDetailsUrl}
                    className="block bg-slate-950 border-t border-slate-100 dark:border-slate-800 overflow-hidden"
                  >
                    <div className="aspect-[16/9] w-full max-h-72 overflow-hidden">
                      <img
                        src={post.image_url}
                        alt={`Flood report at ${post.location}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </Link>
                )}

                {/* Footer bar */}
                <div className="p-3 sm:px-5 bg-slate-50/70 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <ConfirmButton
                    postId={post.id}
                    initialHasConfirmed={post.report_confirmations?.some((c: any) => c.user_id === user.id) || false}
                    initialConfirmCount={post.report_confirmations?.length || 0}
                    isResolved={post.status === "resolved"}
                    isLoggedIn={true}
                  />

                  <Link
                    href={reportDetailsUrl}
                    className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                  >
                    View Public Page →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] py-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-12 transition-colors duration-150">
        <div className="max-w-4xl mx-auto px-4">
          <p>© {new Date().getFullYear()} FloodWatch — Community Flood Safety Network</p>
        </div>
      </footer>
    </div>
  );
}
