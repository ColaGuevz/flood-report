"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfileCooldownInfo } from "@/lib/date";
import { revalidatePath } from "next/cache";

export interface UpdateProfileInput {
  displayName: string;
  username: string;
}

export interface UpdateProfileResult {
  success: boolean;
  error?: string;
  message?: string;
  profile_last_updated_at?: string;
  daysRemaining?: number;
}

/**
 * Server action to safely update a user's display name and username
 * Enforces:
 * 1. User authentication
 * 2. Input validation (display name required, valid username characters)
 * 3. 60-day interval since last update
 * 4. Username uniqueness constraint
 * 5. Update timestamp recording
 */
export async function updateProfile(
  input: UpdateProfileInput
): Promise<UpdateProfileResult> {
  try {
    const supabase = await createClient();

    // 1. Verify authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "You must be signed in to update your profile.",
      };
    }

    const cleanDisplayName = input.displayName?.trim() || "";
    const cleanUsername = input.username?.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, "") || "";

    // 2. Validate input fields
    if (!cleanDisplayName || cleanDisplayName.length < 1) {
      return {
        success: false,
        error: "Display name cannot be empty.",
      };
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      return {
        success: false,
        error: "Username must be at least 3 characters long.",
      };
    }

    if (cleanUsername.length > 30) {
      return {
        success: false,
        error: "Username must not exceed 30 characters.",
      };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return {
        success: false,
        error: "Username can only contain letters, numbers, and underscores.",
      };
    }

    // 3. Fetch current user profile to verify 60-day cooldown
    const { data: currentProfile, error: profileFetchError } = await supabase
      .from("profiles")
      .select("id, username, display_name, profile_last_updated_at")
      .eq("id", user.id)
      .single();

    if (profileFetchError || !currentProfile) {
      return {
        success: false,
        error: "Profile not found.",
      };
    }

    // If no values changed, return success early without modifying timestamp
    if (
      currentProfile.username === cleanUsername &&
      currentProfile.display_name === cleanDisplayName
    ) {
      return {
        success: true,
        message: "No changes made.",
      };
    }

    // 4. Enforce 60-day cooldown server-side
    const cooldown = getProfileCooldownInfo(currentProfile.profile_last_updated_at, 60);
    if (!cooldown.canEdit) {
      return {
        success: false,
        error: cooldown.message,
        daysRemaining: cooldown.daysRemaining,
      };
    }

    // 5. If username changed, check uniqueness across other users
    if (cleanUsername !== currentProfile.username) {
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", cleanUsername)
        .neq("id", user.id)
        .maybeSingle();

      if (checkError) {
        // If query error, continue to db update where DB constraint catches it
      } else if (existingUser) {
        return {
          success: false,
          error: `Username @${cleanUsername} is already taken.`,
        };
      }
    }

    // 6. Record update timestamp and new values
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: cleanDisplayName,
        username: cleanUsername,
        profile_last_updated_at: now,
      })
      .eq("id", user.id);

    if (updateError) {
      if (
        updateError.code === "23505" ||
        updateError.message?.toLowerCase().includes("unique")
      ) {
        return {
          success: false,
          error: `Username @${cleanUsername} is already taken.`,
        };
      }
      return {
        success: false,
        error: updateError.message || "Failed to update profile.",
      };
    }

    revalidatePath("/profile");
    revalidatePath("/");

    return {
      success: true,
      message: "Profile updated successfully.",
      profile_last_updated_at: now,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while updating profile.",
    };
  }
}
