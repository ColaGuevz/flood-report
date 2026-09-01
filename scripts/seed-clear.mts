/**
 * FloodWatch Seed Clear Script
 * =============================
 * Removes ONLY [TEST]-prefixed dummy flood reports from the `posts` table.
 * Real user data is never touched.
 *
 * Usage:
 *   npm run seed:clear
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Environment Guards ────────────────────────────────────────────────────────

if (process.env.NODE_ENV === "production") {
  console.error("❌ ABORT: Clear script cannot run in production environment.");
  console.error("   Set NODE_ENV to 'development' or leave it unset.");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const seedEmail = process.env.SEED_USER_EMAIL;
const seedPassword = process.env.SEED_USER_PASSWORD;

if (!supabaseUrl) {
  console.error("❌ ABORT: Missing NEXT_PUBLIC_SUPABASE_URL in .env.local.");
  process.exit(1);
}

// ─── Supabase Client & Auth Setup ──────────────────────────────────────────────

async function initializeClient(): Promise<SupabaseClient> {
  // Option A: Service Role Key (bypasses RLS)
  if (serviceRoleKey) {
    return createClient(supabaseUrl!, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  // Option B: Dev User Login
  if (seedEmail && seedPassword && publishableKey) {
    const client = createClient(supabaseUrl!, publishableKey);
    const { error: authError } = await client.auth.signInWithPassword({
      email: seedEmail,
      password: seedPassword,
    });

    if (authError) {
      console.error("❌ ABORT: Failed to sign in as dev user:", authError.message);
      process.exit(1);
    }

    return client;
  }

  // Option C: Publishable Key (will work if DELETE RLS policy allows or if service role not needed)
  if (publishableKey) {
    return createClient(supabaseUrl!, publishableKey);
  }

  console.error("❌ ABORT: No Supabase API key available in .env.local.");
  process.exit(1);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = await initializeClient();

  console.log("🧹 FloodWatch Seed Clear Script");
  console.log("─".repeat(50));

  // Count existing test records first
  const { count, error: countError } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .like("location", "[TEST]%");

  if (countError) {
    console.error("❌ Failed to count test records:", countError.message);
    process.exit(1);
  }

  if (!count || count === 0) {
    console.log("ℹ️  No [TEST] records found. Nothing to delete.");
    return;
  }

  console.log(`   Found ${count} [TEST] record(s) to delete.`);
  console.log("");

  // Delete all posts where location starts with [TEST]
  // Note: report_confirmations will be automatically deleted via CASCADE
  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .like("location", "[TEST]%");

  if (deleteError) {
    console.error("❌ Failed to delete test records:", deleteError.message);
    if (deleteError.message.includes("row-level security")) {
      console.error("");
      console.error("   Tip: Set SUPABASE_SERVICE_ROLE_KEY in .env.local to bypass RLS for administrative cleanup.");
    }
    process.exit(1);
  }

  console.log(`✅ Successfully deleted ${count} [TEST] flood report(s).`);
  console.log("   Any associated report_confirmations were also removed (CASCADE).");
  console.log("");
  console.log("   Real user reports were NOT affected.");
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
