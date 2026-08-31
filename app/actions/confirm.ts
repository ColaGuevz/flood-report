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
      console.error("Error inserting confirmation:", insertError);
      return { success: false, error: "Failed to add confirmation." };
    }
  }

  // Revalidate both feed and profile pages to reflect updated counts
  revalidatePath("/");
  revalidatePath("/profile");

  return { success: true };
}
