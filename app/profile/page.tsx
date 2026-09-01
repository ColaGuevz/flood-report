import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import DeletePostButton from "@/app/components/DeletePostButton";
import SeverityBadge from "@/app/components/SeverityBadge";
import StatusBadge from "@/app/components/StatusBadge";
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] flex flex-col font-sans transition-colors duration-200">
      {/* Shared Navbar */}
      <Navbar profile={profile} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Back to feed */}
        <div>
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

        {/* Profile Card with Social Media Banner Cover & Overlapping Avatar */}
        <section className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
          {/* Cover Banner (Blue/Purple Gradient) */}
          <div className="h-32 sm:h-44 md:h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-900 dark:via-indigo-950 dark:to-purple-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.07\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
            <div className="absolute -bottom-6 -right-6 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute -top-6 -left-6 w-36 h-36 rounded-full bg-indigo-400/20 blur-xl pointer-events-none" />
          </div>

          {/* Avatar + Profile Info Area */}
          <div className="px-5 sm:px-8 pb-6 sm:pb-8">
            {/* Top row: Avatar overlapping cover + Action controls & stats */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 md:-mt-20 mb-4">
              {/* Circular Avatar with clean ring border */}
              <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full ring-4 sm:ring-[5px] ring-white dark:ring-slate-900 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center overflow-hidden shadow-lg shadow-slate-900/10 dark:shadow-black/40 shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl sm:text-5xl font-extrabold text-blue-600 dark:text-blue-400">
                    {profile.display_name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>

              {/* Action Controls & Report Stats */}
              <div className="flex items-center gap-3 self-start sm:self-end mt-1 sm:mt-0 flex-wrap">
                {/* Edit Profile Control */}
                <EditProfileModal initialProfile={profile} />

                {/* Report Counter */}
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                  <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    {reportCount}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {reportCount === 1 ? "Report" : "Reports"}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Identity Details */}
            <div className="space-y-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {profile.display_name}
                </h1>
                <p className="text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  @{profile.username}
                </p>
              </div>

              {/* Cooldown Info Badge if active */}
              {!cooldown.canEdit && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                  <span>🔒</span>
                  <span>{cooldown.message}</span>
                </div>
              )}

              {/* Member since & Last Updated */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 flex-wrap text-xs text-slate-400 dark:text-slate-400 font-medium">
                {profile.created_at && (
                  <p className="flex items-center gap-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Member since{" "}
                    {new Date(profile.created_at).toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}

                {profile.profile_last_updated_at && (
                  <p className="flex items-center gap-1 text-slate-400 dark:text-slate-400">
                    <span>•</span>
                    <span>
                      Profile updated {formatRelativeTime(profile.profile_last_updated_at)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Reports Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Flood Reports
            </h2>
            {reportCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700">
                {reportCount}
              </span>
            )}
          </div>

          <Link
            href="/report/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
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
            New Report
          </Link>
        </div>

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

        {/* Empty State */}
        {!error && reportCount === 0 && (
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-10 sm:p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
              📭
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No flood reports yet
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                You haven&apos;t posted any flood reports yet. Be the first to report rising water levels or blocked drainage in your area.
              </p>
            </div>
            <Link
              href="/report/new"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-md shadow-blue-600/25 hover:shadow-lg transition-all"
            >
              <span>+ Create First Report</span>
            </Link>
          </div>
        )}

        {/* Reports List */}
        <div className="space-y-6">
          {posts?.map((post) => {
            const postDate = new Date(post.created_at);

            return (
              <article
                key={post.id}
                className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md dark:hover:shadow-slate-950/60 transition-all duration-200 overflow-hidden"
              >
                {/* Post Header */}
                <div className="p-5 sm:p-6 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Date & location info */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Location Badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0"
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
                          <span>{post.location}</span>
                        </div>

                        {/* Recent Indicator */}
                        {isRecent(post.created_at) && <RecentBadge />}
                      </div>

                      <p className="text-xs text-slate-400 dark:text-slate-400 mt-1.5 flex items-center gap-1.5 font-medium">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <time dateTime={post.created_at} title={postDate.toLocaleString()}>
                          {formatRelativeTime(post.created_at)}
                        </time>
                      </p>
                    </div>

                    {/* Edit / Delete / Toggle Status controls */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                      <ToggleStatusButton
                        postId={post.id}
                        currentStatus={post.status}
                        userId={user.id}
                      />

                      <Link
                        href={`/report/edit/${post.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors"
                        title="Edit report"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span>Edit</span>
                      </Link>

                      <DeletePostButton
                        postId={post.id}
                        userId={user.id}
                      />
                    </div>
                  </div>

                  {/* Badges Row: Severity & Status */}
                  <div className="mt-3.5 flex items-center gap-2 flex-wrap">
                    <SeverityBadge severity={post.severity} />
                    <StatusBadge status={post.status} />
                  </div>
                  <p className="mt-3 text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {post.description}
                  </p>
                  
                  <ConfirmButton 
                    postId={post.id}
                    initialHasConfirmed={post.report_confirmations?.some((c: any) => c.user_id === user.id) || false}
                    initialConfirmCount={post.report_confirmations?.length || 0}
                    isResolved={post.status === 'resolved'}
                  />
                </div>

                {/* Flood Image */}
                {post.image_url && (
                  <div className="relative bg-slate-950/5 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 overflow-hidden">
                    <img
                      src={post.image_url}
                      alt={`Flood report at ${post.location}`}
                      className="w-full max-h-[500px] object-cover hover:scale-[1.01] transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
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
