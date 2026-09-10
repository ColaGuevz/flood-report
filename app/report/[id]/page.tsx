import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";
import Navbar from "@/app/components/Navbar";
import SeverityBadge, { Severity } from "@/app/components/SeverityBadge";
import StatusBadge, { ReportStatus } from "@/app/components/StatusBadge";
import RecentBadge from "@/app/components/RecentBadge";
import ConfirmButton from "@/app/components/ConfirmButton";
import ToggleStatusButton from "@/app/components/ToggleStatusButton";
import DeletePostButton from "@/app/components/DeletePostButton";
import ShareReportSection from "@/app/components/ShareReportSection";
import { formatRelativeTime, isRecent } from "@/lib/date";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select(
      `
      id,
      location,
      description,
      image_url,
      severity,
      status,
      created_at
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (!post) {
    return {
      title: "Report Not Found — FloodWatch",
      description: "The requested flood report could not be found or has been removed.",
    };
  }

  const title = `Flood Alert: ${post.location} — FloodWatch`;
  const cleanDescription = post.description
    ? post.description.length > 150
      ? `${post.description.substring(0, 147)}...`
      : post.description
    : "Live community-verified flood report and road conditions on FloodWatch.";

  const severityLabel = (post.severity || "moderate").toUpperCase();
  const statusLabel = (post.status || "active").toUpperCase();
  const fullMetaDescription = `[${severityLabel} • ${statusLabel}] ${cleanDescription}`;

  return {
    title,
    description: fullMetaDescription,
    alternates: {
      canonical: `/report/${id}`,
    },
    openGraph: {
      title,
      description: fullMetaDescription,
      type: "article",
      url: `/report/${id}`,
      siteName: "FloodWatch — Real-time Community Flood Reports",
      images: post.image_url
        ? [
            {
              url: post.image_url,
              alt: `Flood conditions at ${post.location}`,
            },
          ]
        : [],
    },
    twitter: {
      card: post.image_url ? "summary_large_image" : "summary",
      title,
      description: fullMetaDescription,
      images: post.image_url ? [post.image_url] : [],
    },
  };
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Get current viewer (if authenticated)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. If logged in, fetch viewer profile for Navbar
  let currentProfile: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    currentProfile = profile;
  }

  // 3. Fetch public flood report (only safe public fields)
  const { data: post, error } = await supabase
    .from("posts")
    .select(
      `
      id,
      user_id,
      location,
      description,
      image_url,
      severity,
      status,
      created_at,
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
    .eq("id", id)
    .maybeSingle();

  // 4. Handle not found or deleted reports
  if (error || !post) {
    notFound();
  }

  const rawProfiles = post.profiles as unknown;
  const authorProfile = Array.isArray(rawProfiles)
    ? (rawProfiles[0] as { username: string; display_name: string; avatar_url: string | null } | undefined)
    : (rawProfiles as { username: string; display_name: string; avatar_url: string | null } | null);

  const isOwner = user ? user.id === post.user_id : false;
  const postDate = new Date(post.created_at);
  const relativeTime = formatRelativeTime(post.created_at);
  const isPostRecent = isRecent(post.created_at);
  const hasConfirmed = user
    ? post.report_confirmations?.some((c: { user_id: string }) => c.user_id === user.id) || false
    : false;
  const confirmCount = post.report_confirmations?.length || 0;
  const isResolved = post.status === "resolved";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090e17] flex flex-col font-sans transition-colors duration-150">
      {/* Top Navigation */}
      <Navbar profile={currentProfile} />

      {/* Main Content Area with Desktop 2-Column Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb & Verification Header */}
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
            <span>Back to Live Reports</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <span>🛡️ Verified Public Hazard Report</span>
          </div>
        </div>

        {/* 2-Column Desktop Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Details Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <article className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              {/* Report Header Information */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* Location Heading & Badges */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-start gap-2">
                      <span className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">📍</span>
                      <span>{post.location}</span>
                    </h1>

                    {/* Owner controls for quick access */}
                    {isOwner && user && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          href={`/report/edit/${post.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                        >
                          Edit
                        </Link>
                        <DeletePostButton
                          postId={post.id}
                          userId={user.id}
                          redirectOnDelete="/"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <SeverityBadge severity={post.severity} showDescription />
                    <StatusBadge status={post.status} />
                    {isPostRecent && <RecentBadge />}
                  </div>
                </div>

                {/* Citizen Reporter Card */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {authorProfile?.avatar_url ? (
                        <img
                          src={authorProfile.avatar_url}
                          alt={authorProfile.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {authorProfile?.display_name?.charAt(0)?.toUpperCase() || "👤"}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {authorProfile?.display_name || "Community Member"}
                        {isOwner && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            You (Author)
                          </span>
                        )}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        @{authorProfile?.username || "user"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {relativeTime}
                    </p>
                    <time dateTime={post.created_at} title={postDate.toLocaleString()}>
                      {postDate.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                </div>

                {/* Observations / Description */}
                <div className="space-y-1.5 pt-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Situation & Hazard Details
                  </h2>
                  <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {post.description}
                  </p>
                </div>
              </div>

              {/* High-Resolution Photo Evidence */}
              {post.image_url && (
                <div className="relative bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                  <img
                    src={post.image_url}
                    alt={`Verified flood photo at ${post.location}`}
                    className="w-full max-h-[600px] object-contain mx-auto"
                    loading="eager"
                  />
                </div>
              )}
            </article>
          </div>

          {/* Right Sidebar Column (4 cols) */}
          <aside aria-label="Hazard Actions & Safety" className="lg:col-span-4 space-y-5">
            {/* Community Confirmation Card */}
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Community Verification
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                  Are you in or near this area? Confirm if flood waters are still elevated or if road conditions have changed.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <ConfirmButton
                  postId={post.id}
                  initialHasConfirmed={hasConfirmed}
                  initialConfirmCount={confirmCount}
                  isResolved={isResolved}
                  isLoggedIn={!!user}
                />
              </div>

              {/* Owner Toggle Status */}
              {isOwner && user && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Report Status:
                  </span>
                  <ToggleStatusButton
                    postId={post.id}
                    currentStatus={post.status}
                    userId={user.id}
                  />
                </div>
              )}
            </div>

            {/* Broadcast & Share Section */}
            <ShareReportSection
              reportId={post.id}
              location={post.location}
              description={post.description}
            />

            {/* Civic Safety Advice Checklist */}
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <span>⚠️</span>
                <span>Motorist & Pedestrian Advisory</span>
              </div>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span>•</span>
                  <span>Do not attempt to drive through moving water. Most vehicles can stall in 6–12 inches of water.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span>•</span>
                  <span>Beware of submerged manholes, open drainage canals, and downed electrical lines.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span>•</span>
                  <span>Report stranded individuals directly to local MDRRMO or dial <strong>911</strong>.</span>
                </li>
              </ul>
            </div>

            {/* Guest Sign In Callout */}
            {!user && (
              <div className="bg-slate-900 text-white dark:bg-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-sm font-bold">Have information about this area?</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sign in to confirm flood levels, submit new hazard photos, and keep your neighbors safe.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-colors"
                >
                  Sign In to Participate
                </Link>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] py-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-12 transition-colors duration-150">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p>© {new Date().getFullYear()} FloodWatch — Community Flood Safety Network</p>
        </div>
      </footer>
    </div>
  );
}
