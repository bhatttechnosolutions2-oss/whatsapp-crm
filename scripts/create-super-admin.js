/**
 * Super Admin Seed Script
 * Creates a SUPER_ADMIN user directly via Supabase Service Role API
 * Run: node scripts/create-super-admin.js
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://kogovoqwrmqpujojskjm.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZ292b3F3cm1xcHVqb2pza2ptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU4MzE2MywiZXhwIjoyMTA0MTU5MTYzfQ.Djf4ESkGLbdWstGQwhxIEtyh_6nIvqDtmz5fFCPkzLA";

// ── Super Admin credentials ──────────────────────────────────
const ADMIN_EMAIL    = "superadmin@antigravity.crm";
const ADMIN_PASSWORD = "SuperAdmin@2024!";
const ADMIN_NAME     = "Super Admin";
const ORG_NAME       = "Antigravity Platform";
// ────────────────────────────────────────────────────────────

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("🚀 Creating Super Admin...\n");

  // 1. Create auth user (auto-confirmed)
  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_NAME },
  });

  if (userErr) {
    if (userErr.message.toLowerCase().includes("already")) {
      console.log("ℹ️  User already exists — checking role...");
      const { data: usersData } = await admin.auth.admin.listUsers();
      const existing = usersData.users.find(
        (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      );
      if (existing) await promoteToSuperAdmin(existing.id);
      return;
    }
    console.error("❌ User creation failed:", userErr.message);
    process.exit(1);
  }

  const userId = userRes.user.id;
  console.log("✅ Auth user created:", userId);

  // 2. Create profile
  await admin.from("profiles").upsert({
    id: userId,
    full_name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    phone: null,
    avatar_url: null,
  });
  console.log("✅ Profile created");

  // 3. Create a platform-level organization
  const { data: orgData, error: orgErr } = await admin
    .from("organizations")
    .insert({
      name: ORG_NAME,
      slug: "antigravity-platform",
      email: ADMIN_EMAIL,
      currency: "INR",
      timezone: "Asia/Kolkata",
      status: "ACTIVE",
    })
    .select("id")
    .single();

  if (orgErr && !orgErr.message.includes("duplicate")) {
    console.error("❌ Org creation failed:", orgErr.message);
    process.exit(1);
  }

  const orgId = orgData?.id;
  if (orgId) {
    // 4. Add as SUPER_ADMIN member
    await admin.from("organization_members").insert({
      organization_id: orgId,
      user_id: userId,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    });
    console.log("✅ SUPER_ADMIN role assigned");
  }

  printCredentials();
}

async function promoteToSuperAdmin(userId) {
  const { data: existingMember } = await admin
    .from("organization_members")
    .select("id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMember) {
    await admin
      .from("organization_members")
      .update({ role: "SUPER_ADMIN" })
      .eq("user_id", userId);
    console.log("✅ Existing user promoted to SUPER_ADMIN");
  } else {
    // Need an org first
    const { data: org } = await admin
      .from("organizations")
      .select("id")
      .limit(1)
      .single();

    if (org) {
      await admin.from("organization_members").insert({
        organization_id: org.id,
        user_id: userId,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      });
      console.log("✅ SUPER_ADMIN member record created");
    }
  }
  printCredentials();
}

function printCredentials() {
  console.log("\n" + "═".repeat(50));
  console.log("   ⚡ SUPER ADMIN CREDENTIALS");
  console.log("═".repeat(50));
  console.log(`   URL      : http://localhost:3000/admin-login`);
  console.log(`   Email    : ${ADMIN_EMAIL}`);
  console.log(`   Password : ${ADMIN_PASSWORD}`);
  console.log("═".repeat(50) + "\n");
}

run().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
