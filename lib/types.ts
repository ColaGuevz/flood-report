import { Severity } from "@/app/components/SeverityBadge";
import { ReportStatus } from "@/app/components/StatusBadge";

export type UserRole = "user" | "moderator" | "admin";

export type ModerationStatus = "visible" | "hidden" | "removed";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at?: string;
  profile_last_updated_at?: string | null;
}

export interface PostWithAuthor {
  id: string;
  user_id: string;
  location: string;
  description: string;
  image_url: string;
  severity: Severity | string | null;
  status?: ReportStatus | string | null;
  moderation_status?: ModerationStatus | string;
  moderation_reason?: string | null;
  moderated_at?: string | null;
  moderated_by?: string | null;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    role?: UserRole;
  } | null;
  report_confirmations?: {
    user_id: string;
  }[];
}

export interface ModerationLog {
  id: string;
  report_id: string;
  moderator_id: string | null;
  action: "hide" | "remove" | "restore" | "edit";
  previous_status?: ModerationStatus | string | null;
  new_status: ModerationStatus;
  reason: string;
  created_at: string;
  moderator_profile?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export interface ModerationStats {
  totalReports: number;
  visibleReports: number;
  hiddenReports: number;
  removedReports: number;
  needsReviewReports: number;
}
