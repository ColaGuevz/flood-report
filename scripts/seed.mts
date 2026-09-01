/**
 * FloodWatch Development Seed Script
 * ===================================
 * Generates 100 dummy flood reports in the Supabase `posts` table.
 *
 * Usage:
 *   npm run seed
 *
 * Authentication (choose either Option A or Option B in .env.local):
 *   Option A (Recommended for scripts):
 *     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
 *     SEED_USER_ID=your-user-uuid-here
 *
 *   Option B (Using dev account login):
 *     SEED_USER_EMAIL=your-dev-user@example.com
 *     SEED_USER_PASSWORD=your-dev-user-password
 *
 * All generated records are prefixed with [TEST] in the location column
 * so they can be identified and cleaned up with `npm run seed:clear`.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Environment Guards ────────────────────────────────────────────────────────

if (process.env.NODE_ENV === "production") {
  console.error("❌ ABORT: Seed script cannot run in production environment.");
  console.error("   Set NODE_ENV to 'development' or leave it unset.");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
let seedUserId = process.env.SEED_USER_ID;
const seedEmail = process.env.SEED_USER_EMAIL;
const seedPassword = process.env.SEED_USER_PASSWORD;

if (!supabaseUrl) {
  console.error("❌ ABORT: Missing NEXT_PUBLIC_SUPABASE_URL in .env.local.");
  process.exit(1);
}

// ─── Supabase Client & Auth Setup ──────────────────────────────────────────────

async function initializeClient(): Promise<{ client: SupabaseClient; userId: string }> {
  // Option A: Service Role Key (bypasses RLS)
  if (serviceRoleKey) {
    if (!seedUserId) {
      console.error("❌ ABORT: SUPABASE_SERVICE_ROLE_KEY is set, but SEED_USER_ID is missing.");
      console.error("   Please add SEED_USER_ID=<valid-user-uuid> to .env.local");
      process.exit(1);
    }
    const client = createClient(supabaseUrl!, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return { client, userId: seedUserId };
  }

  // Option B: Dev User Login (satisfies RLS via authenticated session)
  if (seedEmail && seedPassword && publishableKey) {
    console.log("🔑 Authenticating as dev user via email/password...");
    const client = createClient(supabaseUrl!, publishableKey);
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: seedEmail,
      password: seedPassword,
    });

    if (authError || !authData.user) {
      console.error("❌ ABORT: Failed to sign in as dev user:", authError?.message);
      process.exit(1);
    }

    return { client, userId: authData.user.id };
  }

  // If neither auth method is configured:
  console.error("❌ ABORT: Supabase Row-Level Security (RLS) requires authentication to insert posts.");
  console.error("");
  console.error("   Please configure ONE of the following options in .env.local:");
  console.error("");
  console.error("   ▶ Option A (Recommended for scripts):");
  console.error("     Add your Supabase Service Role Key (from Dashboard → Project Settings → API Keys):");
  console.error("     SUPABASE_SERVICE_ROLE_KEY=eyJh...");
  console.error("     SEED_USER_ID=" + (seedUserId || "your-user-uuid"));
  console.error("");
  console.error("   ▶ Option B (Using your Dev account credentials):");
  console.error("     SEED_USER_EMAIL=your-email@example.com");
  console.error("     SEED_USER_PASSWORD=your-password");
  console.error("");
  process.exit(1);
}

// ─── Seed Data Pools ───────────────────────────────────────────────────────────

const MUNICIPALITIES = [
  "Malolos",
  "Guiguinto",
  "Meycauayan",
  "Bocaue",
  "Baliwag",
  "Bulakan",
  "Plaridel",
  "Calumpit",
  "Marilao",
];

const BARANGAYS: Record<string, string[]> = {
  Malolos: ["Brgy. San Jose", "Brgy. Longos", "Brgy. Catmon", "Brgy. Balete", "Brgy. Tikay"],
  Guiguinto: ["Brgy. Sta. Rita", "Brgy. Malis", "Brgy. Tabang", "Brgy. Tabe"],
  Meycauayan: ["Brgy. Malhacan", "Brgy. Calvario", "Brgy. Bancal", "Brgy. Bagbaguin"],
  Bocaue: ["Brgy. Lolomboy", "Brgy. Wakas", "Brgy. Turo", "Brgy. Bunlo"],
  Baliwag: ["Brgy. Pagala", "Brgy. Tangos", "Brgy. Tiaong", "Brgy. Sabang"],
  Bulakan: ["Brgy. San Jose", "Brgy. Taliptip", "Brgy. Bambang", "Brgy. Perez"],
  Plaridel: ["Brgy. Banga", "Brgy. Sipat", "Brgy. Parulan", "Brgy. Agnaya"],
  Calumpit: ["Brgy. Gatbuca", "Brgy. Iba Este", "Brgy. Meyto", "Brgy. Calizon"],
  Marilao: ["Brgy. Lias", "Brgy. Sta. Rosa", "Brgy. Ibayo", "Brgy. Patubig"],
};

const STREET_DETAILS = [
  "near the public market",
  "along the national highway",
  "near the barangay hall",
  "beside the river bank",
  "near the elementary school",
  "along the main road",
  "near the health center",
  "behind the church",
  "near the basketball court",
  "along the creek area",
];

const DESCRIPTIONS_BY_SEVERITY: Record<string, string[]> = {
  minor: [
    "Light flooding on the road, ankle-deep water. Vehicles can still pass slowly. Drainage seems clogged.",
    "Puddles forming on the street after continuous rain. Water is starting to collect near the sidewalk.",
    "Slight flooding near the drainage canal. Water is about 3-4 inches deep. Residents are still walking through.",
    "Minor waterlogging on the residential street. Rain has been steady for 2 hours. Water drains slowly.",
    "Small flood patches on the road. Motorcycles can still pass but need to be careful. Water rising slowly.",
    "Ankle-deep water accumulating near the intersection. Traffic is moving but slower than usual.",
    "Road starting to flood after heavy downpour. Water level is low but increasing. Stay cautious.",
    "Light flooding spotted in low-lying area. Currently manageable but monitoring the situation.",
  ],
  moderate: [
    "Knee-deep flooding on the main road. Cars are having difficulty passing. Some residents are starting to evacuate.",
    "Moderate flooding reaching doorstep levels. Water has been rising for the past hour. Need sandbags.",
    "Flood water is knee-high and still rising. Several streets are becoming impassable for smaller vehicles.",
    "Water level is about 1-2 feet deep. Some houses on lower ground are starting to get water inside.",
    "Significant flooding after continuous heavy rain. Tricycles and motorcycles can no longer pass safely.",
    "Moderate flood conditions — water is reaching the first step of most houses. River is overflowing nearby.",
    "Flood water rising steadily. Currently at knee level. Schools in the area have suspended classes.",
    "Roads partially submerged. Water about 1.5 feet deep. Jeepneys and tricycles rerouting.",
  ],
  severe: [
    "Waist-deep flooding! Roads completely impassable. Families are moving to second floors. Need rescue boats.",
    "Severe flooding — water level is chest-high in some areas. Power lines are dangerously close to water.",
    "Major flood event. Water is waist-deep and still rising rapidly. Multiple families trapped on rooftops.",
    "Severe flooding from river overflow. Entire street is submerged. Evacuations are underway.",
    "Critical water levels — waist to chest deep. No vehicles can pass. Emergency services needed immediately.",
    "Houses flooded up to window level. Residents trapped and calling for help. Boats needed for rescue.",
    "Massive flooding after dam release. Water rose suddenly in the past 30 minutes. Very dangerous situation.",
    "Severe flood — furniture floating in homes. Electricity cut off for safety. People need emergency supplies.",
  ],
  critical: [
    "EMERGENCY! Roof-level flooding in low areas. Multiple families stranded. Immediate rescue needed!",
    "CRITICAL: Entire neighborhood submerged. Water above head level in ground floors. Lives at risk!",
    "URGENT RESCUE NEEDED! Water rose to 2nd floor level. Elderly and children trapped. No electricity.",
    "IMPASSABLE — complete road closure. Bridge submerged. Town cut off from neighboring areas.",
    "EXTREME DANGER: Flash flood swept through the area. Houses damaged. People missing. Send help!",
    "CRITICAL FLOODING: River burst its banks. Entire barangay evacuating. Emergency shelters filling up.",
    "MAXIMUM ALERT: Water level unprecedented. Rooftop evacuations in progress. Military assistance requested.",
    "DIRE SITUATION: Flood water contaminated. No clean water supply. Medical emergencies reported.",
  ],
};

const SEVERITIES = ["minor", "moderate", "severe", "critical"] as const;

// 1×1 transparent PNG as a data URI placeholder — self-contained, no external dependency
const PLACEHOLDER_IMAGE_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function seededChoice<T>(arr: T[], index: number, salt: number = 0): T {
  return arr[(index * 7 + salt * 13) % arr.length];
}

function generateTimestamp(index: number, total: number): string {
  const now = Date.now();
  const maxAgeMs = 30 * 24 * 60 * 60 * 1000;

  const ratio = index / total;
  const skewedRatio = Math.pow(ratio, 1.5);
  const ageMs = skewedRatio * maxAgeMs;

  const jitterMs = ((index * 31337) % (4 * 60 * 60 * 1000)) - 2 * 60 * 60 * 1000;
  const timestamp = new Date(now - ageMs + jitterMs);

  return timestamp.toISOString();
}

function generatePosts(count: number, userId: string): Array<Record<string, unknown>> {
  const posts: Array<Record<string, unknown>> = [];

  for (let i = 0; i < count; i++) {
    const severity = SEVERITIES[i % SEVERITIES.length];
    const status: string = i % 10 < 7 ? "active" : "resolved";

    const municipality = seededChoice(MUNICIPALITIES, i, 1);
    const barangays = BARANGAYS[municipality];
    const barangay = seededChoice(barangays, i, 2);
    const streetDetail = seededChoice(STREET_DETAILS, i, 3);

    const location = `[TEST] ${barangay}, ${municipality}, Bulacan — ${streetDetail}`;
    const descPool = DESCRIPTIONS_BY_SEVERITY[severity];
    const description = `[TEST] ${seededChoice(descPool, i, 4)}`;
    const created_at = generateTimestamp(i, count);

    posts.push({
      user_id: userId,
      location,
      description,
      severity,
      status,
      image_url: PLACEHOLDER_IMAGE_URL,
      created_at,
    });
  }

  return posts;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { client: supabase, userId } = await initializeClient();

  console.log("🌊 FloodWatch Seed Script");
  console.log("─".repeat(50));
  console.log(`   Supabase URL:  ${supabaseUrl}`);
  console.log(`   User ID:       ${userId}`);
  console.log(`   Records:       100`);
  console.log("─".repeat(50));

  // Verify the user exists by attempting to read their profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    console.error("❌ ABORT: Could not find a profile for user ID: " + userId);
    console.error(`   Error: ${profileError?.message || "No profile found"}`);
    console.error("   Make sure the user has logged in and completed profile setup.");
    process.exit(1);
  }

  console.log(`   Profile:       @${profile.username} (${profile.display_name})`);
  console.log("─".repeat(50));

  // Check for existing test data
  const { count: existingCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .like("location", "[TEST]%");

  if (existingCount && existingCount > 0) {
    console.warn(`⚠️  Found ${existingCount} existing [TEST] records.`);
    console.warn("   Run 'npm run seed:clear' first to remove them, or they will be added alongside new ones.");
    console.log("");
  }

  // Generate and insert
  const posts = generatePosts(100, userId);

  console.log("📝 Inserting 100 dummy flood reports...");

  const BATCH_SIZE = 25;
  let inserted = 0;

  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabase.from("posts").insert(batch);

    if (insertError) {
      console.error(`❌ Failed to insert batch ${i / BATCH_SIZE + 1}:`, insertError.message);
      console.error("   Partial seed may have occurred. Run 'npm run seed:clear' to clean up.");
      process.exit(1);
    }

    inserted += batch.length;
    console.log(`   ✓ Batch ${i / BATCH_SIZE + 1}/4 — ${inserted}/100 records inserted`);
  }

  console.log("");
  console.log("✅ Seed complete! 100 dummy flood reports created.");
  console.log("");
  console.log("   Severity distribution:");
  console.log("     • 25 minor  🟢");
  console.log("     • 25 moderate  🟡");
  console.log("     • 25 severe  🟠");
  console.log("     • 25 critical  🔴");
  console.log("");
  console.log("   Status distribution:");
  console.log("     • ~70 active  🔴");
  console.log("     • ~30 resolved  🟢");
  console.log("");
  console.log("   Timestamps: from a few minutes ago to ~30 days ago");
  console.log("");
  console.log("   To remove test data:  npm run seed:clear");
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
