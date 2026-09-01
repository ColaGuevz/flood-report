"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
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
  { id: "all", label: "All" },
  { id: "minor", label: "Minor", emoji: "🟢" },
  { id: "moderate", label: "Moderate", emoji: "🟡" },
  { id: "severe", label: "Severe", emoji: "🟠" },
  { id: "critical", label: "Critical", emoji: "🔴" },
];

const STATUS_FILTERS: { id: string; label: string; emoji?: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active", emoji: "🔴" },
  { id: "resolved", label: "Resolved", emoji: "🟢" },
];

export default function FeedList({ posts, currentUserId }: FeedListProps) {
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
      {/* Search and Filter Controls Card */}
      <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-4 backdrop-blur-xs transition-colors duration-200">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
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
            placeholder="Search municipality or barangay (e.g. Malolos, Bulacan)..."
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700/80 pl-10 pr-9 py-3 text-sm text-slate-900 dark:text-white bg-slate-50/80 dark:bg-slate-800/60 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              title="Clear search"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Rows */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 min-w-16">
              Status:
            </span>
            {STATUS_FILTERS.map((filter) => {
              const isSelected = selectedStatus === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSelectedStatus(filter.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer select-none border ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600 dark:text-white shadow-xs scale-102"
                      : "bg-slate-100/90 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {filter.emoji && <span>{filter.emoji}</span>}
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>

          {/* Severity Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 min-w-16">
                Severity:
              </span>
              {SEVERITY_FILTERS.map((filter) => {
                const isSelected = selectedSeverity === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setSelectedSeverity(filter.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer select-none border ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600 dark:text-white shadow-xs scale-102"
                        : "bg-slate-100/90 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {filter.emoji && <span>{filter.emoji}</span>}
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active filters count & Clear button */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2.5 self-end sm:self-center text-xs pt-1 sm:pt-0">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Showing {filteredPosts.length} of {localPosts.length}
                </span>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feed Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Live Flood Reports
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700">
            {filteredPosts.length}
          </span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Updated in real-time
        </span>
      </div>

      {/* Empty States */}
      {/* 1. Database is completely empty */}
      {localPosts.length === 0 && (
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-10 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
            ☀️
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No flood reports right now
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Looks like roads are clear! Be the first to report any rising water levels or blocked drainage.
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

      {/* 2. Filter / Search yielded 0 results */}
      {localPosts.length > 0 && filteredPosts.length === 0 && (
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-8 sm:p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center text-2xl mx-auto shadow-inner">
            🔍
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No flood reports match your search
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              No reports found matching your selected filters. Try searching for a different location or adjusting the severity/status filters.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer border border-slate-700/50"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Filtered Posts List */}
      <div className="space-y-6">
        {filteredPosts.map((post) => {
          const isOwner = post.user_id === currentUserId;
          const postDate = new Date(post.created_at);
          const relativeTime = formatRelativeTime(post.created_at);
          const isPostRecent = isRecent(post.created_at);

          return (
            <article
              key={post.id}
              className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md dark:hover:shadow-slate-950/60 transition-all duration-200 overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-5 sm:p-6 pb-4">
                <div className="flex items-start justify-between gap-4">
                  {/* User profile info */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl ring-2 ring-slate-100 dark:ring-slate-800 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {post.profiles?.avatar_url ? (
                        <img
                          src={post.profiles.avatar_url}
                          alt={post.profiles.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-base font-bold text-slate-600 dark:text-slate-300">
                          {post.profiles?.display_name?.charAt(0)?.toUpperCase() || "👤"}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {post.profiles?.display_name || "Community Member"}
                        </p>
                        {isOwner && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                            You
                          </span>
                        )}
                        {/* 24-hour Recent indicator badge */}
                        {isPostRecent && <RecentBadge />}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>@{post.profiles?.username || "user"}</span>
                        <span>•</span>
                        <time dateTime={post.created_at} title={postDate.toLocaleString()}>
                          {relativeTime}
                        </time>
                      </p>
                    </div>
                  </div>

                  {/* Post Owner Controls (Edit / Delete / Toggle Status) */}
                  {isOwner && (
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
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
                        userId={currentUserId}
                      />
                    </div>
                  )}
                </div>

                {/* Location Badge */}
                <div className="mt-4">
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
                </div>

                {/* Badges Row: Severity & Status */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <SeverityBadge severity={post.severity} />
                  <StatusBadge status={post.status} />
                </div>

                {/* Description */}
                <p className="mt-3.5 text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal">
                  {post.description}
                </p>
                
                {/* Community Confirmation */}
                <ConfirmButton
                  postId={post.id}
                  initialHasConfirmed={post.report_confirmations?.some(c => c.user_id === currentUserId) || false}
                  initialConfirmCount={post.report_confirmations?.length || 0}
                  isResolved={post.status === "resolved"}
                />
              </div>

              {/* Flood Image */}
              {post.image_url && (
                <div className="relative bg-slate-950/5 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={`Flood report at ${post.location}`}
                    className="w-full max-h-[550px] object-cover hover:scale-[1.01] transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
