"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  createClientOrgSchema,
  CreateClientOrgInput,
  updateClientOrgSchema,
  UpdateClientOrgInput,
} from "@/lib/validations/organization";
import crypto from "crypto";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Admin credentials not configured");
  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface AdminActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

export async function checkSuperAdminAccess(): Promise<{ ok: boolean; userId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "SUPER_ADMIN")
    .limit(1)
    .maybeSingle();

  return { ok: !!data, userId: user.id };
}

export async function getAdminStats() {
  const { ok } = await checkSuperAdminAccess();
  if (!ok) redirect("/admin-login?error=unauthorized");

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
  if (!ok) redirect("/admin-login?error=unauthorized");

  const admin = getSupabaseAdmin();

  const { data: orgs, error } = await admin
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !orgs) return [];

  // Enrich with member, lead, invoice, and primary client owner details
  const enriched = await Promise.all(
    orgs.map(async (org) => {
      const [members, leads, invoices, ownerRes] = await Promise.all([
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
        admin
          .from("organization_members")
          .select("user_id, role, profiles(full_name, email, phone)")
          .eq("organization_id", org.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      const revenue = (invoices.data ?? [])
        .filter((i) => i.status === "PAID")
        .reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);

      const ownerProfile = (ownerRes.data?.profiles as any) || null;
      const ownerName =
        (org as any).owner_contact_name || ownerProfile?.full_name || "—";
      const ownerEmail =
        (org as any).owner_contact_email || ownerProfile?.email || org.email || "—";
      const ownerPhone =
        (org as any).owner_contact_phone || ownerProfile?.phone || org.phone || "—";

      return {
        ...org,
        plan: (org as any).plan || "FREE",
        business_type: (org as any).business_type || "OTHER",
        onboarding_completed: !!(org as any).onboarding_completed,
        ownerName,
        ownerEmail,
        ownerPhone,
        ownerRole: ownerRes.data?.role || "CLIENT",
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
  if (!ok) redirect("/admin-login?error=unauthorized");

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
    const profile = m.profiles as unknown as {
      full_name: string;
      email: string;
      avatar_url: string | null;
    } | null;
    const org = m.organizations as unknown as { name: string; slug: string } | null;

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

export async function createClientOrganization(input: CreateClientOrgInput) {
  const { ok, userId: adminUserId } = await checkSuperAdminAccess();
  if (!ok) {
    return { success: false, error: "Unauthorized: Super Admin access required" };
  }

  const parseResult = createClientOrgSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Validation failed",
    };
  }

  const data = parseResult.data;
  const admin = getSupabaseAdmin();

  try {
    // Generate clean unique slug from business name
    let baseSlug = data.businessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!baseSlug) baseSlug = "client-org";

    let slug = baseSlug;
    let attempts = 0;
    while (attempts < 10) {
      const { data: existingSlug } = await admin
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!existingSlug) break;
      attempts++;
      slug = `${baseSlug}-${crypto.randomBytes(2).toString("hex")}`;
    }

    const webhookToken = crypto.randomBytes(20).toString("hex");

    // Construct organization record payload
    const orgPayload: Record<string, any> = {
      name: data.businessName,
      slug,
      website: data.websiteUrl || null,
      phone: data.phone || null,
      email: data.email || data.ownerEmail,
      timezone: data.timezone || "Asia/Kolkata",
      currency: "INR",
      status: data.status,
      webhook_token: webhookToken,
    };

    // Include additional columns if present in schema
    try {
      orgPayload.plan = data.plan;
      orgPayload.business_type = data.businessType;
      orgPayload.address = data.address || null;
      orgPayload.city = data.city || null;
      orgPayload.state = data.state || null;
      orgPayload.country = data.country || "India";
      orgPayload.onboarding_completed = false;
      orgPayload.onboarding_step = 1;
      orgPayload.owner_contact_name = data.ownerName;
      orgPayload.owner_contact_email = data.ownerEmail;
      orgPayload.owner_contact_phone = data.ownerPhone || null;
      orgPayload.enabled_modules = data.enabledModules;
    } catch {
      // ignore
    }

    let createdOrg: any = null;
    const { data: orgData, error: orgErr } = await admin
      .from("organizations")
      .insert(orgPayload)
      .select("id, name, slug, status")
      .single();

    if (orgErr || !orgData) {
      // Fallback: insert with core columns if optional columns haven't migrated yet
      const fallbackPayload = {
        name: data.businessName,
        slug,
        website: data.websiteUrl || null,
        phone: data.phone || null,
        email: data.email || data.ownerEmail,
        timezone: data.timezone || "Asia/Kolkata",
        currency: "INR",
        status: data.status,
        webhook_token: webhookToken,
      };
      const { data: fbOrg, error: fbErr } = await admin
        .from("organizations")
        .insert(fallbackPayload)
        .select("id, name, slug, status")
        .single();

      if (fbErr || !fbOrg) {
        return { success: false, error: "Failed to create organization: " + (fbErr?.message || orgErr?.message) };
      }
      createdOrg = fbOrg;
    } else {
      createdOrg = orgData;
    }

    // 2. Create or invite the primary client user via Supabase Auth Admin
    const { data: usersData } = await admin.auth.admin.listUsers();
    let existingUser = usersData?.users.find(
      (u) => u.email?.toLowerCase() === data.ownerEmail.toLowerCase()
    );

    let clientUserId: string;
    if (existingUser) {
      clientUserId = existingUser.id;
    } else {
      // Create user without storing plaintext password
      const tempPass = `Client@${crypto.randomBytes(4).toString("hex")}!`;
      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email: data.ownerEmail,
        password: tempPass,
        email_confirm: true,
        user_metadata: { full_name: data.ownerName },
      });

      if (createErr || !newUser?.user) {
        return {
          success: false,
          error: "Organization created, but failed to create client user: " + createErr?.message,
        };
      }
      clientUserId = newUser.user.id;
    }

    // 3. Upsert profile
    await admin.from("profiles").upsert({
      id: clientUserId,
      full_name: data.ownerName,
      email: data.ownerEmail,
      phone: data.ownerPhone || data.phone || null,
    });

    // 4. Assign membership with CLIENT role
    await admin.from("organization_members").upsert(
      {
        organization_id: createdOrg.id,
        user_id: clientUserId,
        role: "CLIENT",
        status: "ACTIVE",
      },
      { onConflict: "organization_id,user_id" }
    );

    // 5. Record audit log
    try {
      await admin.from("audit_logs").insert({
        organization_id: createdOrg.id,
        user_id: adminUserId,
        action: "ORGANIZATION_CREATED",
        entity_type: "ORGANIZATION",
        entity_id: createdOrg.id,
        details: {
          businessName: data.businessName,
          plan: data.plan,
          ownerEmail: data.ownerEmail,
        },
      });
    } catch {
      // non-blocking
    }

    revalidatePath("/admin/organizations");
    revalidatePath("/admin/users");
    revalidatePath("/admin/dashboard");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return {
      success: true,
      message: `Organization "${data.businessName}" created successfully!`,
      organization: {
        id: createdOrg.id,
        name: createdOrg.name,
        slug: createdOrg.slug,
      },
      invitation: {
        loginUrl: `${appUrl}/login`,
        clientEmail: data.ownerEmail,
        businessName: data.businessName,
        emailDeliveryConfigured: false, // Transparent: email SMTP delivery is not configured
        instruction: `Client account created with role CLIENT. The client can log in at ${appUrl}/login with their email (${data.ownerEmail}) to begin onboarding.`,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Internal server error creating organization",
    };
  }
}

export async function updateOrganizationStatus(
  orgId: string,
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE" | "PENDING"
) {
  const { ok, userId } = await checkSuperAdminAccess();
  if (!ok) {
    return { success: false, error: "Unauthorized: Super Admin access required" };
  }

  const admin = getSupabaseAdmin();
  const dbStatus = status === "PENDING" ? "INACTIVE" : status;

  const { error } = await admin
    .from("organizations")
    .update({ status: dbStatus, updated_at: new Date().toISOString() })
    .eq("id", orgId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Audit log
  try {
    await admin.from("audit_logs").insert({
      organization_id: orgId,
      user_id: userId,
      action: status === "SUSPENDED" ? "ORGANIZATION_SUSPENDED" : "ORGANIZATION_ACTIVATED",
      entity_type: "ORGANIZATION",
      entity_id: orgId,
      details: { newStatus: status },
    });
    
    if (status === "ACTIVE") {
      const { data: orgData } = await admin.from("organizations").select("name, email").eq("id", orgId).single();
      if (orgData) {
        console.log(`
        =========================================================
        EMAIL NOTIFICATION TO: ${orgData.email}
        SUBJECT: Your Antigravity CRM Account is Approved!
        
        Hi there,
        
        Great news! Your organization "${orgData.name}" has been approved by the Super Admin.
        You can now log in to your Antigravity CRM dashboard.
        
        Login URL: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login
        
        Welcome aboard!
        =========================================================
        `);
      }
    }
  } catch {
    // non-blocking
  }

  revalidatePath("/admin/organizations");
  revalidatePath("/admin/dashboard");

  return {
    success: true,
    message: `Organization status updated to ${status}`,
  };
}

export async function updateOrganizationBasicInfo(
  orgId: string,
  input: UpdateClientOrgInput
) {
  const { ok, userId } = await checkSuperAdminAccess();
  if (!ok) {
    return { success: false, error: "Unauthorized: Super Admin access required" };
  }

  const parseResult = updateClientOrgSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Validation failed",
    };
  }

  const data = parseResult.data;
  const admin = getSupabaseAdmin();

  const updatePayload: Record<string, any> = {
    name: data.name,
    website: data.website || null,
    phone: data.phone || null,
    email: data.email || null,
    timezone: data.timezone || "Asia/Kolkata",
    updated_at: new Date().toISOString(),
  };

  try {
    if (data.business_type) updatePayload.business_type = data.business_type;
    if (data.plan) updatePayload.plan = data.plan;
    if (data.status) updatePayload.status = data.status;
    if (data.address) updatePayload.address = data.address;
    if (data.city) updatePayload.city = data.city;
    if (data.state) updatePayload.state = data.state;
    if (data.country) updatePayload.country = data.country;
  } catch {
    // ignore
  }

  const { error } = await admin
    .from("organizations")
    .update(updatePayload)
    .eq("id", orgId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Audit log
  try {
    await admin.from("audit_logs").insert({
      organization_id: orgId,
      user_id: userId,
      action: "ORGANIZATION_UPDATED",
      entity_type: "ORGANIZATION",
      entity_id: orgId,
      details: { updatedFields: Object.keys(updatePayload) },
    });
  } catch {
    // non-blocking
  }

  revalidatePath("/admin/organizations");
  return { success: true, message: "Organization updated successfully" };
}

export async function adminLoginCheck(email: string): Promise<{ isSuperAdmin: boolean }> {
  const admin = getSupabaseAdmin();
  const { data: users } = await admin.auth.admin.listUsers();
  const user = users?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) return { isSuperAdmin: false };

  const { data: member } = await admin
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "SUPER_ADMIN")
    .limit(1)
    .maybeSingle();

  return { isSuperAdmin: !!member };
}

export async function adminLoginUser(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
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
        error:
          error?.message === "Invalid login credentials"
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
      .limit(1)
      .maybeSingle();

    if (!memberData) {
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

export async function updateUserRole(userId: string, newRole: string) {
  const { ok, userId: adminUserId } = await checkSuperAdminAccess();
  if (!ok) return { success: false, error: "Unauthorized" };

  const admin = getSupabaseAdmin();

  // Special care for SUPER_ADMIN: only current SUPER_ADMIN can promote to SUPER_ADMIN
  const { error } = await admin
    .from("organization_members")
    .update({ role: newRole })
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true, message: `User role updated to ${newRole}` };
}

export async function updateUserStatus(userId: string, newStatus: "ACTIVE" | "SUSPENDED" | "INVITED") {
  const { ok } = await checkSuperAdminAccess();
  if (!ok) return { success: false, error: "Unauthorized" };

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("organization_members")
    .update({ status: newStatus })
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true, message: `User status updated to ${newStatus}` };
}

export async function deleteUser(userId: string) {
  const { ok } = await checkSuperAdminAccess();
  if (!ok) return { success: false, error: "Unauthorized" };

  const admin = getSupabaseAdmin();

  // Delete from organization_members and profiles first if cascading isn't set up
  await admin.from("organization_members").delete().eq("user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);
  
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true, message: "User permanently deleted." };
}

export async function deleteOrganization(orgId: string) {
  const { ok } = await checkSuperAdminAccess();
  if (!ok) return { success: false, error: "Unauthorized" };

  const admin = getSupabaseAdmin();

  const { error } = await admin.from("organizations").delete().eq("id", orgId);
  
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/organizations");
  revalidatePath("/admin/dashboard");
  return { success: true, message: "Organization deleted successfully." };
}

export async function getAllGlobalLeads() {
  const { ok } = await checkSuperAdminAccess();
  if (!ok) return { success: false, error: "Unauthorized" };

  const admin = getSupabaseAdmin();
  const { data: leads, error } = await admin
    .from("leads")
    .select(`
      *,
      organizations:organization_id (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, leads };
}

export async function getAllGlobalWhatsAppMessages() {
  const { ok } = await checkSuperAdminAccess();
  if (!ok) return { success: false, error: "Unauthorized" };

  const admin = getSupabaseAdmin();
  const { data: messages, error } = await admin
    .from("whatsapp_messages")
    .select(`
      *,
      organizations:organization_id (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, messages };
}
