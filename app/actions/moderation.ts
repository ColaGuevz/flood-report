"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithProfile, isModeratorRole, isAdminRole } from "@/lib/auth";
import { ModerationStatus, UserRole } from "@/lib/types";
import { revalidatePath } from "next/cache";

export interface ModerateReportInput {
  reportId: string;
  action: "hide" | "remove" | "restore";
  reason: string;
}

export interface ModerateReportResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface UpdateUserRoleInput {
  targetUserId: string;
  newRole: UserRole;
}

export interface UpdateUserRoleResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Server action to moderate a flood report (Hide, Remove, Restore)
 * Enforces:
 * 1. Server-side session verification
 * 2. Moderator or Admin role requirement
 * 3. Mandatory moderation reason
 * 4. Audit logging into `moderation_logs` table
 */
export async function moderateReport(
  input: ModerateReportInput
): Promise<ModerateReportResult> {
  try {
    const { user, profile } = await getCurrentUserWithProfile();

    if (!user || !profile) {
      return {
        success: false,
        error: "You must be signed in to moderate reports.",
      };
    }

    if (!isModeratorRole(profile.role)) {
      return {
        success: false,
        error: "Access Denied: You do not have moderator permissions.",
      };
    }

    const { reportId, action, reason } = input;
    const cleanReason = reason?.trim();

    if (!cleanReason || cleanReason.length < 3) {
      return {
        success: false,
        error: "A valid moderation reason (at least 3 characters) is required.",
      };
    }

    let nextStatus: ModerationStatus;
    if (action === "hide") {
      nextStatus = "hidden";
    } else if (action === "remove") {
      nextStatus = "removed";
    } else if (action === "restore") {
      nextStatus = "visible";
    } else {
      return {
        success: false,
        error: "Invalid moderation action specified.",
      };
    }

    const supabase = await createClient();

    // 1. Fetch current post details for previous_status record
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("id, moderation_status")
      .eq("id", reportId)
      .maybeSingle();

    if (fetchError || !post) {
      return {
        success: false,
        error: "Target flood report not found.",
      };
    }

    const previousStatus = post.moderation_status || "visible";
    const now = new Date().toISOString();

    // 2. Update post moderation state
    const { data: updatedRows, error: updateError } = await supabase
      .from("posts")
      .update({
        moderation_status: nextStatus,
        moderation_reason: cleanReason,
        moderated_at: now,
        moderated_by: user.id,
      })
      .eq("id", reportId)
      .select("id");

    if (updateError) {
      console.error("Error updating post moderation state:", updateError);
      return {
        success: false,
        error: updateError.message || "Failed to update report moderation status.",
      };
    }

    if (!updatedRows || updatedRows.length === 0) {
      return {
        success: false,
        error:
          "Database update rejected by Supabase RLS policies. Please run the updated SQL policies in Supabase SQL Editor.",
      };
    }

    // 3. Insert audit log record into moderation_logs table
    const { error: logError } = await supabase.from("moderation_logs").insert({
      report_id: reportId,
      moderator_id: user.id,
      action,
      previous_status: previousStatus,
      new_status: nextStatus,
      reason: cleanReason,
      created_at: now,
    });

    if (logError) {
      // Log error but don't fail the primary action since post was updated
      console.warn("Notice: Failed to insert audit log entry:", logError.message);
    }

    // 4. Revalidate all related routes
    revalidatePath("/");
    revalidatePath("/moderation");
    revalidatePath(`/report/${reportId}`);
    revalidatePath("/profile");

    const actionText =
      nextStatus === "visible"
        ? "restored to public feed"
        : nextStatus === "hidden"
        ? "temporarily hidden from public feed"
        : "marked as removed";

    return {
      success: true,
      message: `Report successfully ${actionText}.`,
    };
  } catch (err: any) {
    console.error("Unexpected error during moderation:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while executing moderation action.",
    };
  }
}

/**
 * Server action for Admins to manage user roles (Assign/Revoke Moderator, etc.)
 * Enforces:
 * 1. Administrator role requirement
 * 2. Valid role enum ('user', 'moderator', 'admin')
 */
export async function updateUserRole(
  input: UpdateUserRoleInput
): Promise<UpdateUserRoleResult> {
  try {
    const { user, profile } = await getCurrentUserWithProfile();

    if (!user || !profile) {
      return {
        success: false,
        error: "You must be signed in to manage roles.",
      };
    }

    if (!isAdminRole(profile.role)) {
      return {
        success: false,
        error: "Access Denied: Administrator permissions required to manage roles.",
      };
    }

    const { targetUserId, newRole } = input;

    if (!["user", "moderator", "admin"].includes(newRole)) {
      return {
        success: false,
        error: "Invalid role specified.",
      };
    }

    const supabase = await createClient();

    // Check if target user exists
    const { data: targetProfile, error: targetError } = await supabase
      .from("profiles")
      .select("id, role, username, display_name")
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetError || !targetProfile) {
      return {
        success: false,
        error: "Target user not found.",
      };
    }

    // Prevent modifying own admin role to avoid accidental lockout
    if (user.id === targetUserId && newRole !== "admin") {
      return {
        success: false,
        error: "Safety Guard: You cannot demote your own administrator account.",
      };
    }

    const { data: updatedRoleRows, error: updateError } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", targetUserId)
      .select("id");

    if (updateError) {
      console.error("Error updating user role:", updateError);
      return {
        success: false,
        error: updateError.message || "Failed to update user role in database.",
      };
    }

    if (!updatedRoleRows || updatedRoleRows.length === 0) {
      return {
        success: false,
        error:
          "Database update rejected by Supabase RLS policies. Please ensure admin UPDATE policy is applied on profiles.",
      };
    }

    revalidatePath("/moderation");

    return {
      success: true,
      message: `Role for @${targetProfile.username} updated to ${newRole.toUpperCase()}.`,
    };
  } catch (err: any) {
    console.error("Unexpected error updating user role:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while updating user role.",
    };
  }
}
