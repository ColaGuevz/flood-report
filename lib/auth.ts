import { createClient } from "@/lib/supabase/server";
import { Profile, UserRole } from "./types";
import { User } from "@supabase/supabase-js";

export function isModeratorRole(role?: UserRole | string | null): boolean {
  return role === "moderator" || role === "admin";
}

export function isAdminRole(role?: UserRole | string | null): boolean {
  return role === "admin";
}

export async function getCurrentUserWithProfile(): Promise<{
  user: User | null;
  profile: Profile | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { user: null, profile: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return { user, profile: null };
    }

    // Default role fallback to 'user'
    const cleanProfile: Profile = {
      ...profile,
      role: (profile.role as UserRole) || "user",
    };

    return { user, profile: cleanProfile };
  } catch (err) {
    console.error("Error retrieving user and profile:", err);
    return { user: null, profile: null };
  }
}

export async function requireModeratorOrAdmin(): Promise<{
  user: User;
  profile: Profile;
}> {
  const { user, profile } = await getCurrentUserWithProfile();

  if (!user || !profile) {
    throw new Error("Authentication required.");
  }

  if (!isModeratorRole(profile.role)) {
    throw new Error("Access Denied: You do not have moderator or administrator privileges.");
  }

  return { user, profile };
}

export async function requireAdmin(): Promise<{
  user: User;
  profile: Profile;
}> {
  const { user, profile } = await getCurrentUserWithProfile();

  if (!user || !profile) {
    throw new Error("Authentication required.");
  }

  if (!isAdminRole(profile.role)) {
    throw new Error("Access Denied: Administrator privileges required.");
  }

  return { user, profile };
}
