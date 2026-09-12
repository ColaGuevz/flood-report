"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DeletePostButton from "./DeletePostButton";
import SeverityBadge, { Severity } from "./SeverityBadge";
import StatusBadge, { ReportStatus } from "./StatusBadge";
import ToggleStatusButton from "./ToggleStatusButton";
import RecentBadge from "./RecentBadge";
import ConfirmButton from "./ConfirmButton";
import { formatRelativeTime, isRecent } from "@/lib/date";

export interface FeedPost {
  id: string;
  user_id: string;
  location: string;
  description: string;
  image_url: string;
  severity: Severity | string | null;
  status?: ReportStatus | string | null;
  moderation_status?: string | null;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  report_confirmations?: {
    user_id: string;
  }[];
}

interface FeedListProps {
  posts: FeedPost[];
  currentUserId: string;
}

const SEVERITY_FILTERS: { id: string; label: string; emoji?: string }[] = [
  { id: "all", label: "All Severity" },
  { id: "minor", label: "Minor", emoji: "🟢" },
  { id: "moderate", label: "Moderate", emoji: "🟡" },
  { id: "severe", label: "Severe", emoji: "🟠" },
  { id: "critical", label: "Critical", emoji: "🔴" },
];

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All Status" },
  { id: "active", label: "Active Hazards" },
  { id: "resolved", label: "Resolved" },
];

export default function FeedList({ posts, currentUserId }: FeedListProps) {
  const router = useRouter();
  const [localPosts, setLocalPosts] = useState<FeedPost[]>(posts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Keep local posts synced with incoming server posts
  useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);

  const handleStatusChange = (postId: string, newStatus: ReportStatus) => {
    setLocalPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p))
    );
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedSeverity !== "all" ||
    selectedStatus !== "all";

  // Filter posts based on location search, severity selection, and status selection
  const filteredPosts = useMemo(() => {
    return localPosts.filter((post) => {
      // 1. Status filter
      if (selectedStatus !== "all") {
        const postStatus = post.status || "active";
        if (postStatus !== selectedStatus) {
          return false;
        }
      }

      // 2. Severity filter
      if (selectedSeverity !== "all") {
        const postSeverity = post.severity || "moderate";
        if (postSeverity !== selectedSeverity) {
          return false;
        }
      }

      // 3. Location search (case-insensitive)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const locationText = (post.location || "").toLowerCase();
        if (!locationText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [localPosts, selectedStatus, selectedSeverity, searchQuery]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedSeverity("all");
    setSelectedStatus("all");
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Control Panel */}
      <section
        aria-label="Filter Flood Reports"
        className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-xs"
      >
        {/* Search Input */}
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search municipality, street, or barangay (e.g., Malolos, San Jose)..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 pl-10 pr-9 py-2.5 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 dark:focus:border-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] mr-1">
              Status:
            </span>
            {STATUS_FILTERS.map((filter) => {
              const isSelected = selectedStatus === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSelectedStatus(filter.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer border ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] mr-1">
              Severity:
            </span>
            {SEVERITY_FILTERS.map((filter) => {
              const isSelected = selectedSeverity === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSelectedSeverity(filter.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer border ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {filter.emoji && <span className="mr-1">{filter.emoji}</span>}
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Summary & Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing <strong>{filteredPosts.length}</strong> of <strong>{localPosts.length}</strong> reports
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Reports Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Live Community Reports
          </h2>
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {filteredPosts.length}
          </span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Auto-synced
        </span>
      </div>

      {/* Zero Database Reports Empty State */}
      {localPosts.length === 0 && (
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl mx-auto border border-blue-200 dark:border-blue-900">
            ✓
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Active Flood Reports
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No community hazard reports on record. Roads are clear or unmonitored. Be the first to post if water levels rise.
            </p>
          </div>
          <Link
            href="/report/new"
            className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <span>+ Submit Local Report</span>
          </Link>
        </div>
      )}

      {/* Filter Yielded Zero Results */}
      {localPosts.length > 0 && filteredPosts.length === 0 && (
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-lg mx-auto">
            🔍
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No reports match your filters
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              No flooding reports found matching your current query. Try broadening your location search or adjusting severity filters.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer border border-slate-700"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Reports Feed Stream */}
      <div className="space-y-4">
        {filteredPosts.map((post) => {
          const isOwner = post.user_id === currentUserId;
          const postDate = new Date(post.created_at);
          const relativeTime = formatRelativeTime(post.created_at);
          const isPostRecent = isRecent(post.created_at);
          const reportDetailsUrl = `/report/${post.id}`;

          return (
            <article
              key={post.id}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (!target.closest("button, a, input, textarea")) {
                  router.push(reportDetailsUrl);
                }
              }}
              className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-150 overflow-hidden cursor-pointer shadow-xs"
            >
              {/* Report Header */}
              <div className="p-4 sm:p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  {/* Location & Time Headline */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={reportDetailsUrl}
                        className="inline-flex items-center gap-1.5 font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-sm sm:text-base tracking-tight"
                      >
                        <span className="text-rose-600 dark:text-rose-400 shrink-0">📍</span>
                        <span>{post.location}</span>
                      </Link>
                      {isPostRecent && <RecentBadge />}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                      <span>Reported by <strong>{post.profiles?.display_name || "Community Member"}</strong> (@{post.profiles?.username || "user"})</span>
                      <span>•</span>
                      <time dateTime={post.created_at} title={postDate.toLocaleString()}>
                        {relativeTime}
                      </time>
                    </p>
                  </div>

                  {/* Badges & Owner Controls */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {isOwner && (
                      <div className="flex items-center gap-1">
                        <ToggleStatusButton
                          postId={post.id}
                          currentStatus={post.status}
                          userId={currentUserId}
                          onStatusChange={(newStatus) =>
                            handleStatusChange(post.id, newStatus)
                          }
                        />

                        <Link
                          href={`/report/edit/${post.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
                          userId={currentUserId}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Badges Row */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <SeverityBadge severity={post.severity} />
                  <StatusBadge status={post.status} />
                </div>

                {/* Description Body */}
                <p className="mt-3 text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {post.description}
                </p>
              </div>

              {/* Photo Evidence with Consistent Aspect Ratio */}
              {post.image_url && (
                <Link
                  href={reportDetailsUrl}
                  className="block relative bg-slate-900 border-t border-slate-100 dark:border-slate-800 overflow-hidden group"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden bg-slate-950/20">
                    <img
                      src={post.image_url}
                      alt={`Flood report at ${post.location}`}
                      className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>
                </Link>
              )}

              {/* Action Footer */}
              <div className="p-4 sm:px-5 py-3 bg-slate-50/70 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <ConfirmButton
                  postId={post.id}
                  initialHasConfirmed={
                    post.report_confirmations?.some(
                      (c) => c.user_id === currentUserId
                    ) || false
                  }
                  initialConfirmCount={
                    post.report_confirmations?.length || 0
                  }
                  isResolved={post.status === "resolved"}
                  isLoggedIn={!!currentUserId}
                />

                <Link
                  href={reportDetailsUrl}
                  className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:underline"
                >
                  <span>View Details & Share</span>
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
