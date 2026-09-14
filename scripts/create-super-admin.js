/**
 * Super Admin Seed Script
 * Creates a SUPER_ADMIN using Supabase Service Role API.
 *
 * SECURITY:
 * - Never hardcode credentials or service-role keys in source control.
 * - Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL and
 *   ADMIN_PASSWORD in the execution environment.
 */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || "Super Admin";
const ORG_NAME = process.env.ORG_NAME || "Antigravity Platform";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD");
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 12) {
  console.error("ADMIN_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("Creating Super Admin...");

  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_NAME },
  });

  let userId = userRes?.user?.id;
  if (userErr) {
    if (!userErr.message.toLowerCase().includes("already")) {
      console.error("User creation failed:", userErr.message);
      process.exit(1);
    }
    const { data: usersData, error: listError } = await admin.auth.admin.listUsers();
    if (listError) throw listError;
    const existing = usersData.users.find(
      (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
    );
    if (!existing) throw new Error("Existing admin account could not be located.");
    userId = existing.id;
  }

  if (!userId) throw new Error("Unable to resolve admin user id.");

  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    full_name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    phone: null,
    avatar_url: null,
  });
  if (profileError) throw profileError;

  let { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", "antigravity-platform")
    .maybeSingle();

  if (!org) {
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
    if (orgErr) throw orgErr;
    org = orgData;
  }

  const { error: memberError } = await admin
    .from("organization_members")
    .upsert({
      organization_id: org.id,
      user_id: userId,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    }, { onConflict: "organization_id,user_id" });

  if (memberError) throw memberError;

  console.log("SUPER_ADMIN configured successfully for:", ADMIN_EMAIL);
  console.log("Credentials are intentionally not printed. Use your environment variables.");
}

run().catch((err) => {
  console.error("Fatal error:", err instanceof Error ? err.message : "Unknown error");
  process.exit(1);
});
