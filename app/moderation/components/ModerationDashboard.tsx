"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PostWithAuthor, Profile, ModerationStatus, UserRole } from "@/lib/types";
import SeverityBadge from "@/app/components/SeverityBadge";
import StatusBadge from "@/app/components/StatusBadge";
import ModerationStatusBadge from "@/app/components/ModerationStatusBadge";
import ModerationActionModal from "./ModerationActionModal";
import RoleManagementSection from "./RoleManagementSection";
import { formatRelativeTime } from "@/lib/date";

interface ModerationDashboardProps {
  initialPosts: PostWithAuthor[];
  allProfiles: Profile[];
  currentProfile: Profile;
}

export default function ModerationDashboard({
  initialPosts,
  allProfiles,
  currentProfile,
}: ModerationDashboardProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [activeTab, setActiveTab] = useState<"reports" | "users">("reports");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [selectedPost, setSelectedPost] = useState<PostWithAuthor | null>(null);
  const [modalAction, setModalAction] = useState<"hide" | "remove" | "restore">("hide");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Statistics computation
  const stats = useMemo(() => {
    const total = posts.length;
    const visible = posts.filter((p) => (p.moderation_status || "visible") === "visible").length;
    const hidden = posts.filter((p) => p.moderation_status === "hidden").length;
    const removed = posts.filter((p) => p.moderation_status === "removed").length;
    const needsReview = hidden + removed;

    return {
      total,
      visible,
      hidden,
      removed,
      needsReview,
    };
  }, [posts]);

  // Filtering reports
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const modStatus = post.moderation_status || "visible";

      // 1. Status Filter
      if (statusFilter === "visible" && modStatus !== "visible") return false;
      if (statusFilter === "hidden" && modStatus !== "hidden") return false;
      if (statusFilter === "removed" && modStatus !== "removed") return false;
      if (statusFilter === "needs_review" && modStatus === "visible") return false;

      // 2. Severity Filter
      if (severityFilter !== "all") {
        if ((post.severity || "moderate") !== severityFilter) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const loc = (post.location || "").toLowerCase();
        const desc = (post.description || "").toLowerCase();
        const author = (post.profiles?.display_name || "").toLowerCase();
        const username = (post.profiles?.username || "").toLowerCase();
        const reason = (post.moderation_reason || "").toLowerCase();

        if (
          !loc.includes(query) &&
          !desc.includes(query) &&
          !author.includes(query) &&
          !username.includes(query) &&
          !reason.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [posts, statusFilter, severityFilter, searchQuery]);

  const handleOpenModal = (post: PostWithAuthor, action: "hide" | "remove" | "restore") => {
    setSelectedPost(post);
    setModalAction(action);
    setIsModalOpen(true);
  };

  const handleModerationSuccess = (
    updatedPostId: string,
    nextStatus: string,
    reason: string
  ) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === updatedPostId
          ? {
              ...p,
              moderation_status: nextStatus as ModerationStatus,
              moderation_reason: reason,
              moderated_at: new Date().toISOString(),
              moderated_by: currentProfile.id,
            }
          : p
      )
    );
  };

  const isAdmin = currentProfile.role === "admin";

  return (
    <div className="space-y-6">
      {/* Moderation Metrics Banner */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Reports */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Submissions
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.total}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">All community records</p>
        </div>

        {/* Public / Visible */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Publicly Visible
          </p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
            {stats.visible}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Active on live feed</p>
        </div>

        {/* Hidden Reports */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Hidden Reports
          </p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
            {stats.hidden}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Pending review</p>
        </div>

        {/* Removed Reports */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Removed Reports
          </p>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1">
            {stats.removed}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Policy violations</p>
        </div>

        {/* Needs Review / Action */}
        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Moderated Queue
          </p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
            {stats.needsReview}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Hidden + Removed</p>
        </div>
      </section>

      {/* Main Tabs Navigation (Reports Queue vs Role Administration) */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === "reports"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <span>🛡️ Reports Moderation Queue</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {posts.length}
            </span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-2 ${
                activeTab === "users"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <span>👑 Role Management</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                Admin
              </span>
            </button>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2 pb-3">
          <span className="text-xs text-slate-400">Moderator session:</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {currentProfile.role.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tab 1: Reports Moderation Queue */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search report location, description, reporter @handle, or moderation notes..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 outline-none transition focus:bg-white dark:focus:bg-slate-750 focus:border-blue-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Queue Filter:
                </span>
                {[
                  { id: "all", label: "All Submissions", count: stats.total },
                  { id: "visible", label: "Public Only", count: stats.visible },
                  { id: "hidden", label: "Hidden", count: stats.hidden },
                  { id: "removed", label: "Removed", count: stats.removed },
                  { id: "needs_review", label: "Needs Review", count: stats.needsReview },
                ].map((tab) => {
                  const isSelected = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Severity:
                </span>
                {["all", "minor", "moderate", "severe", "critical"].map((sev) => {
                  const isSelected = severityFilter === sev;
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverityFilter(sev)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {sev}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reports List */}
          {filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
              <span className="text-2xl">🔍</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No reports matching filter criteria
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try resetting filters or adjusting search queries to view submissions in this queue.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const modStatus = (post.moderation_status || "visible") as ModerationStatus;
                const isHidden = modStatus === "hidden";
                const isRemoved = modStatus === "removed";
                const isVisible = modStatus === "visible";
                const reportUrl = `/report/${post.id}`;

                return (
                  <article
                    key={post.id}
                    className={`bg-white dark:bg-[#0f172a] rounded-2xl border transition-colors shadow-xs overflow-hidden ${
                      isRemoved
                        ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/20"
                        : isHidden
                        ? "border-amber-300 dark:border-amber-900/60 bg-amber-50/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {/* Top Meta Bar */}
                    <div className="p-4 sm:p-5 pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        {/* Location & Reporter Headline */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={reportUrl}
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 text-sm sm:text-base tracking-tight"
                            >
                              📍 {post.location}
                            </Link>
                            <ModerationStatusBadge status={modStatus} />
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                            <span>
                              Reporter: <strong>{post.profiles?.display_name || "Citizen"}</strong> (@{post.profiles?.username || "user"})
                            </span>
                            <span>•</span>
                            <span>Submitted {formatRelativeTime(post.created_at)}</span>
                            <span>•</span>
                            <span className="font-mono text-[11px] text-slate-400">
                              ID: {post.id}
                            </span>
                          </p>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          <SeverityBadge severity={post.severity} />
                          <StatusBadge status={post.status} />
                        </div>
                      </div>

                      {/* Observations Body */}
                      <p className="mt-3 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                        {post.description}
                      </p>

                      {/* Moderation Context Banner (if moderated) */}
                      {(post.moderation_reason || isHidden || isRemoved) && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <span>🛡️ Moderation Note:</span>
                              <span className="font-normal text-slate-600 dark:text-slate-300">
                                {post.moderation_reason || "No explicit reason specified."}
                              </span>
                            </span>
                            {post.moderated_at && (
                              <span className="text-[10px] text-slate-400">
                                {formatRelativeTime(post.moderated_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Image Evidence Thumbnail if attached */}
                    {post.image_url && (
                      <div className="px-4 sm:px-5 pb-3">
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-w-sm bg-slate-950 aspect-[16/9]">
                          <img
                            src={post.image_url}
                            alt={post.location}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}

                    {/* Moderation Controls Footer */}
                    <div className="p-3 sm:px-5 bg-slate-50 dark:bg-slate-850/60 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      {/* Public Link */}
                      <Link
                        href={reportUrl}
                        className="font-semibold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>View Public Page Details →</span>
                      </Link>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Hide Button (if not already hidden) */}
                        {!isHidden && (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(post, "hide")}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                          >
                            <span>🔒 Hide</span>
                          </button>
                        )}

                        {/* Remove Button (if not already removed) */}
                        {!isRemoved && (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(post, "remove")}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                          >
                            <span>🚫 Remove</span>
                          </button>
                        )}

                        {/* Restore Button (if hidden or removed) */}
                        {(isHidden || isRemoved) && (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(post, "restore")}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                          >
                            <span>🔄 Restore to Public</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: User Role Management (Admin only) */}
      {activeTab === "users" && isAdmin && (
        <RoleManagementSection
          initialProfiles={allProfiles}
          currentAdminId={currentProfile.id}
        />
      )}

      {/* Action Reason Modal */}
      {selectedPost && (
        <ModerationActionModal
          post={selectedPost}
          action={modalAction}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPost(null);
          }}
          onSuccess={handleModerationSuccess}
        />
      )}
    </div>
  );
}
