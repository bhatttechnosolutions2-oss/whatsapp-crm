"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Admin credentials not configured");
  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function checkSuperAdminAccess(): Promise<{ ok: boolean; userId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "SUPER_ADMIN")
    .maybeSingle();

  return { ok: !!data, userId: user.id };
}

export async function getAdminStats() {
  const { ok } = await checkSuperAdminAccess();
  if (!ok) redirect("/admin/login?error=unauthorized");

  const admin = getSupabaseAdmin();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [orgsRes, usersRes, invoicesRes, leadsRes, newOrgsRes] = await Promise.all([
    admin.from("organizations").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("invoices").select("total_amount, status"),
    admin.from("leads").select("id, status", { count: "exact", head: true }),
    admin
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfMonth),
  ]);

  const invoices = invoicesRes.data ?? [];
  const totalRevenue = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);

  const pendingRevenue = invoices
    .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);

  return {
    totalOrgs: orgsRes.count ?? 0,
    totalUsers: usersRes.count ?? 0,
    totalLeads: leadsRes.count ?? 0,
    totalRevenue,
    pendingRevenue,
    newOrgsThisMonth: newOrgsRes.count ?? 0,
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter((i) => i.status === "PAID").length,
  };
}

export async function getAllOrganizations() {
  const { ok } = await checkSuperAdminAccess();
  if (!ok) redirect("/admin/login?error=unauthorized");

  const admin = getSupabaseAdmin();

  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name, slug, status, email, phone, created_at, currency")
    .order("created_at", { ascending: false });

  if (!orgs) return [];

  // Enrich with member/lead/invoice counts
  const enriched = await Promise.all(
    orgs.map(async (org) => {
      const [members, leads, invoices] = await Promise.all([
        admin
          .from("organization_members")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", org.id),
        admin
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", org.id),
        admin
          .from("invoices")
          .select("total_amount, status")
          .eq("organization_id", org.id),
      ]);

      const revenue = (invoices.data ?? [])
        .filter((i) => i.status === "PAID")
        .reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);

      return {
        ...org,
        memberCount: members.count ?? 0,
        leadCount: leads.count ?? 0,
        revenue,
      };
    })
  );

  return enriched;
}

export async function getAllUsers() {
  const { ok } = await checkSuperAdminAccess();
  if (!ok) redirect("/admin/login?error=unauthorized");

  const admin = getSupabaseAdmin();

  const { data: members } = await admin
    .from("organization_members")
    .select(`
      id, role, status, created_at,
      user_id,
      profiles(full_name, email, avatar_url),
      organizations(name, slug)
    `)
    .order("created_at", { ascending: false });

  return (members ?? []).map((m) => {
    // Supabase returns related rows; cast through unknown for type safety
    const profile = (m.profiles as unknown) as { full_name: string; email: string; avatar_url: string | null } | null;
    const org = (m.organizations as unknown) as { name: string; slug: string } | null;

    return {
      memberId: m.id,
      userId: m.user_id,
      role: m.role,
      status: m.status,
      joinedAt: m.created_at,
      fullName: profile?.full_name ?? "—",
      email: profile?.email ?? "—",
      orgName: org?.name ?? "—",
      orgSlug: org?.slug ?? "—",
    };
  });
}

export async function adminLoginCheck(email: string): Promise<{ isSuperAdmin: boolean }> {
  const admin = getSupabaseAdmin();
  const { data: users } = await admin.auth.admin.listUsers();
  const user = users?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) return { isSuperAdmin: false };

  const { data } = await admin
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "SUPER_ADMIN")
    .maybeSingle();

  return { isSuperAdmin: !!data };
}

export interface AdminActionResult {
  success: boolean;
  error?: string;
}

export async function adminLoginUser(
  prevState: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  try {
    const supabase = await createClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !authData.user) {
      return {
        success: false,
        error: error?.message === "Invalid login credentials"
          ? "Invalid email or password"
          : error?.message ?? "Authentication failed",
      };
    }

    // Check SUPER_ADMIN role
    const adminClient = getSupabaseAdmin();
    const { data: memberData } = await adminClient
      .from("organization_members")
      .select("role")
      .eq("user_id", authData.user.id)
      .eq("role", "SUPER_ADMIN")
      .maybeSingle();

    if (!memberData) {
      // Sign them back out — not an admin
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Access denied. Your account does not have Super Admin privileges.",
      };
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }

  redirect("/admin/dashboard");
}
