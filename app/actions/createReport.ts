"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Allowed MIME types for image uploads
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Map MIME types to valid file extensions
const MIME_TO_EXT: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
};

export interface CreateReportInput {
  location: string;
  description: string;
  severity: string;
  idempotencyKey: string;
}

export interface CreateReportResult {
  success: boolean;
  error?: string;
  message?: string;
  retryAfterSeconds?: number;
  reportId?: string;
  isDuplicate?: boolean;
  existingReportId?: string;
}

/**
 * Server action to create a new flood report with full anti-spam protection.
 *
 * Enforces:
 * 1. Authentication
 * 2. Image validation (type, size, extension)
 * 3. Rate limiting (5min, hourly, daily windows via PostgreSQL)
 * 4. Duplicate location detection (same user + location within 30min)
 * 5. Idempotency key (prevents double-click / network retry)
 * 6. Orphan image cleanup on post insert failure
 */
export async function createReport(
  formData: FormData
): Promise<CreateReportResult> {
  try {
    // ── 1. Authentication ──────────────────────────────────────
    const { user, profile } = await getCurrentUserWithProfile();

    if (!user || !profile) {
      return {
        success: false,
        error: "You must be logged in to submit a flood report.",
      };
    }

    // ── 2. Extract and validate form fields ────────────────────
    const location = (formData.get("location") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const severity = (formData.get("severity") as string)?.trim();
    const idempotencyKey = (formData.get("idempotencyKey") as string)?.trim();
    const imageFile = formData.get("image") as File | null;

    if (!location) {
      return {
        success: false,
        error: "Please specify the exact location or barangay.",
      };
    }

    if (!description) {
      return {
        success: false,
        error: "Please describe the current situation and road conditions.",
      };
    }

    const validSeverities = ["minor", "moderate", "severe", "critical"];
    if (!severity || !validSeverities.includes(severity)) {
      return {
        success: false,
        error: "Please select a valid severity level.",
      };
    }

    if (!idempotencyKey) {
      return {
        success: false,
        error: "Missing submission key. Please refresh the page and try again.",
      };
    }

    // ── 3. Image validation ────────────────────────────────────
    if (!imageFile || imageFile.size === 0) {
      return {
        success: false,
        error:
          "Please attach a photograph of the flooding as visual evidence.",
      };
    }

    // Validate MIME type
    if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
      return {
        success: false,
        error: `Invalid image format "${imageFile.type}". Please upload a JPG, PNG, WEBP, or GIF file.`,
      };
    }

    // Validate file size
    if (imageFile.size > MAX_FILE_SIZE) {
      const sizeMB = (imageFile.size / (1024 * 1024)).toFixed(1);
      return {
        success: false,
        error: `Image size (${sizeMB}MB) exceeds the 10MB limit. Please choose a smaller photo.`,
      };
    }

    // Validate file extension matches MIME type
    const fileExtension = (imageFile.name.split(".").pop() || "").toLowerCase();
    const allowedExts = MIME_TO_EXT[imageFile.type] || [];
    if (fileExtension && allowedExts.length > 0 && !allowedExts.includes(fileExtension)) {
      return {
        success: false,
        error: `File extension ".${fileExtension}" does not match the image type. Please upload a valid image file.`,
      };
    }

    const supabase = await createClient();

    // ── 4. Idempotency check ───────────────────────────────────
    // Check if a report with this idempotency key already exists (prevents double-submit)
    const { data: existingByKey } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", user.id)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existingByKey) {
      return {
        success: true,
        message:
          "This report was already submitted successfully.",
        reportId: String(existingByKey.id),
      };
    }

    // ── 5. Rate limit check (via PostgreSQL function) ──────────
    const { data: rateLimitResult, error: rateLimitError } = await supabase.rpc(
      "check_report_rate_limit",
      { user_uuid: user.id }
    );

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
      // If the RPC function doesn't exist yet, allow submission with a warning
      // This ensures the app works before the SQL migration is applied
      if (
        rateLimitError.message?.includes("function") &&
        rateLimitError.message?.includes("does not exist")
      ) {
        console.warn(
          "Rate limit function not found — skipping rate limit check. Run schema_rate_limiting.sql in Supabase."
        );
      } else {
        return {
          success: false,
          error: "Unable to verify submission eligibility. Please try again.",
        };
      }
    }

    if (rateLimitResult && !rateLimitResult.allowed) {
      return {
        success: false,
        error: rateLimitResult.reason,
        retryAfterSeconds: rateLimitResult.retry_after_seconds,
      };
    }

    // ── 6. Duplicate location check (via PostgreSQL function) ──
    const { data: dupeResult, error: dupeError } = await supabase.rpc(
      "check_duplicate_report",
      { user_uuid: user.id, location_text: location }
    );

    if (dupeError) {
      console.error("Duplicate check error:", dupeError);
      // Gracefully continue if function doesn't exist yet
      if (
        !(
          dupeError.message?.includes("function") &&
          dupeError.message?.includes("does not exist")
        )
      ) {
        return {
          success: false,
          error: "Unable to verify report uniqueness. Please try again.",
        };
      }
    }

    if (dupeResult && dupeResult.is_duplicate) {
      return {
        success: false,
        error:
          "You recently submitted a report for this same location. Please update your existing report instead, or wait 30 minutes before submitting a new one.",
        isDuplicate: true,
        existingReportId: String(dupeResult.existing_report_id),
      };
    }

    // ── 7. Upload image to Supabase Storage ────────────────────
    const safeExtension = allowedExts[0] || fileExtension || "jpg";
    const fileName = `${user.id}/${crypto.randomUUID()}.${safeExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(fileName, imageFile);

    if (uploadError) {
      console.error("Image upload error:", uploadError);
      return {
        success: false,
        error: `Image upload failed: ${uploadError.message}`,
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("post-images").getPublicUrl(fileName);

    // ── 8. Insert post into database ───────────────────────────
    const { data: newPost, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        location,
        description,
        severity,
        status: "active",
        image_url: publicUrl,
        idempotency_key: idempotencyKey,
      })
      .select("id")
      .single();

    if (postError) {
      console.error("Post insert error:", postError);

      // ── 9. Orphan cleanup: delete uploaded image if post failed ──
      const { error: cleanupError } = await supabase.storage
        .from("post-images")
        .remove([fileName]);

      if (cleanupError) {
        console.warn("Failed to clean up orphaned image:", cleanupError);
      }

      // Check if it's a unique constraint violation (idempotency key race condition)
      if (
        postError.code === "23505" &&
        postError.message?.includes("idempotency_key")
      ) {
        // Another concurrent request already created this report
        const { data: raceResult } = await supabase
          .from("posts")
          .select("id")
          .eq("user_id", user.id)
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();

        if (raceResult) {
          return {
            success: true,
            message: "This report was already submitted successfully.",
            reportId: String(raceResult.id),
          };
        }
      }

      return {
        success: false,
        error: postError.message || "Failed to create flood report.",
      };
    }

    // ── 10. Success ────────────────────────────────────────────
    revalidatePath("/");
    revalidatePath("/profile");
    revalidatePath("/moderation");

    return {
      success: true,
      message: "Your flood hazard alert is now live for the community.",
      reportId: String(newPost.id),
    };
  } catch (err: any) {
    console.error("Unexpected error in createReport:", err);
    return {
      success: false,
      error:
        err?.message || "An unexpected error occurred. Please try again.",
    };
  }
}
