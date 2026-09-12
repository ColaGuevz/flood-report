"use client";

import { useState } from "react";
import { Profile, UserRole } from "@/lib/types";
import { updateUserRole } from "@/app/actions/moderation";
import { useToast } from "@/app/components/Toast";

interface RoleManagementSectionProps {
  initialProfiles: Profile[];
  currentAdminId: string;
}

export default function RoleManagementSection({
  initialProfiles,
  currentAdminId,
}: RoleManagementSectionProps) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredProfiles = profiles.filter((p) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase().trim();
    return (
      (p.username || "").toLowerCase().includes(query) ||
      (p.display_name || "").toLowerCase().includes(query) ||
      (p.role || "").toLowerCase().includes(query)
    );
  });

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    setUpdatingId(targetUserId);

    try {
      const result = await updateUserRole({ targetUserId, newRole });

      if (!result.success) {
        toast({
          type: "error",
          title: "Role Update Failed",
          message: result.error || "Could not change user role.",
        });
        setUpdatingId(null);
        return;
      }

      setProfiles((prev) =>
        prev.map((p) => (p.id === targetUserId ? { ...p, role: newRole } : p))
      );

      toast({
        type: "success",
        title: "Role Updated",
        message: result.message || `User role changed to ${newRole.toUpperCase()}.`,
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Unexpected Error",
        message: err?.message || "An error occurred.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    if (role === "admin") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          👑 Administrator
        </span>
      );
    }
    if (role === "moderator") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          🛡️ Moderator
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        👤 Citizen User
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🛡️</span>
            <span>User & Moderator Role Administration</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Designate trusted community members as moderators or adjust administrative permissions.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, handle, or role..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 outline-none transition focus:bg-white dark:focus:bg-slate-750 focus:border-blue-600"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Users Table / Card List */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Citizen User</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4 text-right">Role Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No users matching &quot;{search}&quot;
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => {
                  const isCurrentAdmin = p.id === currentAdminId;
                  const isUpdating = updatingId === p.id;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                            {p.avatar_url ? (
                              <img
                                src={p.avatar_url}
                                alt={p.display_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                                {p.display_name?.charAt(0)?.toUpperCase() || "U"}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{p.display_name}</span>
                              {isCurrentAdmin && (
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                                  (You)
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400">@{p.username}</p>
                          </div>
                        </div>
                      </td>

                      {/* Current Role */}
                      <td className="py-3 px-4">{getRoleBadge(p.role)}</td>

                      {/* User ID (Safe prefix) */}
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {p.id.slice(0, 12)}...
                      </td>

                      {/* Role Actions */}
                      <td className="py-3 px-4 text-right">
                        {isCurrentAdmin ? (
                          <span className="text-[11px] text-slate-400 italic">
                            Protected (Current Session)
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {isUpdating ? (
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <select
                                value={p.role}
                                onChange={(e) =>
                                  handleRoleChange(p.id, e.target.value as UserRole)
                                }
                                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2.5 py-1 text-xs font-semibold cursor-pointer outline-none focus:border-blue-600"
                              >
                                <option value="user">User</option>
                                <option value="moderator">Moderator</option>
                                <option value="admin">Administrator</option>
                              </select>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
