"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleConfirmation(reportId: string) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to confirm a report." };
  }

  // ── Rate limit check: max 30 toggles per hour ──────────────
  const { data: rateLimitResult, error: rateLimitError } = await supabase.rpc(
    "check_confirmation_rate_limit",
    { user_uuid: user.id }
  );

  if (rateLimitError) {
    // Gracefully skip if function doesn't exist yet (migration not applied)
    if (
      !(
        rateLimitError.message?.includes("function") &&
        rateLimitError.message?.includes("does not exist")
      )
    ) {
      console.error("Confirmation rate limit check error:", rateLimitError);
      return { success: false, error: "Unable to verify confirmation eligibility. Please try again." };
    }
  }

  if (rateLimitResult && !rateLimitResult.allowed) {
    return { success: false, error: rateLimitResult.reason };
  }

  // Check if a confirmation already exists
  const { data: existingConfirmation, error: fetchError } = await supabase
    .from("report_confirmations")
    .select("id")
    .eq("report_id", reportId)
    .eq("user_id", user.id)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 means no rows found, which is fine
    console.error("Error fetching confirmation:", fetchError);
    return { success: false, error: "Failed to verify existing confirmation." };
  }

  if (existingConfirmation) {
    // Unconfirm (Delete)
    const { error: deleteError } = await supabase
      .from("report_confirmations")
      .delete()
      .eq("id", existingConfirmation.id);

    if (deleteError) {
      console.error("Error deleting confirmation:", deleteError);
      return { success: false, error: "Failed to remove confirmation." };
    }
  } else {
    // Confirm (Insert)
    const { error: insertError } = await supabase
      .from("report_confirmations")
      .insert({
        report_id: reportId,
        user_id: user.id,
      });

    if (insertError) {
      // Handle unique constraint violation (duplicate insert race condition)
      if (insertError.code === "23505") {
        return { success: true }; // Already confirmed, treat as success
      }
      console.error("Error inserting confirmation:", insertError);
      return { success: false, error: "Failed to add confirmation." };
    }
  }

  // Revalidate both feed and profile pages to reflect updated counts
  revalidatePath("/");
  revalidatePath("/profile");

  return { success: true };
}
