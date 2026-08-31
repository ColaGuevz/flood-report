/**
 * Formats a date/timestamp into a friendly relative string
 * e.g. "Just now", "5 minutes ago", "2 hours ago", "Yesterday", "3 days ago"
 */
export function formatRelativeTime(dateInput: string | Date | number): string {
  if (!dateInput) return "";

  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();

  // If time is slightly in the future (due to minor clock skew), show "Just now"
  if (diffInMs < 0 && diffInMs > -60000) {
    return "Just now";
  }

  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  if (diffInMinutes === 1) {
    return "1 minute ago";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  }

  if (diffInHours === 1) {
    return "1 hour ago";
  }

  if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  }

  if (diffInDays === 1) {
    return "Yesterday";
  }

  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  // For older posts, show formatted date (e.g. "Oct 14, 2025" or "Oct 14")
  const isSameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: isSameYear ? undefined : "numeric",
  });
}

/**
 * Checks if a report was created within the last N hours (default: 24 hours)
 */
export function isRecent(
  dateInput: string | Date | number,
  thresholdHours = 24
): boolean {
  if (!dateInput) return false;

  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();

  const thresholdMs = thresholdHours * 60 * 60 * 1000;
  return diffInMs >= 0 && diffInMs <= thresholdMs;
}

export interface ProfileCooldownInfo {
  canEdit: boolean;
  daysRemaining: number;
  nextEligibleDate: Date | null;
  message: string;
}

/**
 * Calculates profile edit cooldown (default: 60 days)
 * If lastUpdatedAt is null/undefined or >= 60 days ago, user can edit immediately.
 */
export function getProfileCooldownInfo(
  lastUpdatedAt: string | Date | number | null | undefined,
  cooldownDays = 60
): ProfileCooldownInfo {
  if (!lastUpdatedAt) {
    return {
      canEdit: true,
      daysRemaining: 0,
      nextEligibleDate: null,
      message: "You can update your profile.",
    };
  }

  const lastDate =
    typeof lastUpdatedAt === "object" ? lastUpdatedAt : new Date(lastUpdatedAt);
  
  if (isNaN(lastDate.getTime())) {
    return {
      canEdit: true,
      daysRemaining: 0,
      nextEligibleDate: null,
      message: "You can update your profile.",
    };
  }

  const now = new Date();
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
  const timeSinceLastUpdateMs = now.getTime() - lastDate.getTime();

  if (timeSinceLastUpdateMs >= cooldownMs) {
    return {
      canEdit: true,
      daysRemaining: 0,
      nextEligibleDate: null,
      message: "You can update your profile.",
    };
  }

  const remainingMs = cooldownMs - timeSinceLastUpdateMs;
  const daysRemaining = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  const nextEligibleDate = new Date(lastDate.getTime() + cooldownMs);

  return {
    canEdit: false,
    daysRemaining,
    nextEligibleDate,
    message: `You can change your profile again in ${daysRemaining} day${
      daysRemaining === 1 ? "" : "s"
    }.`,
  };
}
