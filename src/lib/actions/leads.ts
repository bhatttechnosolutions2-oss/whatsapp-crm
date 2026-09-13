"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createLeadSchema, leadActivitySchema } from "@/lib/validations/leads";
import { Lead, LeadActivity, LeadStatus, LeadSource, DashboardLeadStats, LeadWithActivities } from "@/types/crm";

export interface LeadActionResult {
  success: boolean;
  error?: string;
  message?: string;
  leadId?: string;
}

// Get user's active organization ID securely
async function getAuthenticatedUserOrg() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!member) return null;

  return {
    userId: user.id,
    orgId: member.organization_id,
    role: member.role,
  };
}

export async function createLead(
  prevState: LeadActionResult | null,
  formData: FormData
): Promise<LeadActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) {
    return { success: false, error: "Unauthorized access" };
  }

  const rawData = {
    fullName: (formData.get("fullName") as string)?.trim(),
    phone: (formData.get("phone") as string)?.trim(),
    email: (formData.get("email") as string)?.trim() || "",
    company: (formData.get("company") as string)?.trim() || "",
    source: (formData.get("source") as LeadSource) || "MANUAL",
    status: (formData.get("status") as LeadStatus) || "NEW",
    estimatedValue: Number(formData.get("estimatedValue")) || 0,
    notes: (formData.get("notes") as string)?.trim() || "",
  };

  const validation = createLeadSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Validation failed",
    };
  }

  try {
    const supabase = await createClient();

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        organization_id: auth.orgId,
        full_name: rawData.fullName,
        phone: rawData.phone,
        email: rawData.email || null,
        company: rawData.company || null,
        source: rawData.source,
        status: rawData.status,
        estimated_value: rawData.estimatedValue,
        notes: rawData.notes || null,
        assigned_to: auth.userId,
      })
      .select("id")
      .single();

    if (error || !lead) {
      return { success: false, error: error?.message || "Failed to create lead" };
    }

    // Log initial lead activity
    await supabase.from("lead_activities").insert({
      organization_id: auth.orgId,
      lead_id: lead.id,
      user_id: auth.userId,
      type: "NOTE",
      title: "Lead Created",
      description: rawData.notes
        ? `Lead manually created with notes: ${rawData.notes}`
        : "Lead manually registered in pipeline",
    });

    // Create in-app notification
    await supabase.from("notifications").insert({
      organization_id: auth.orgId,
      title: `New Lead: ${rawData.fullName}`,
      message: `Source: ${rawData.source} | Estimated: ₹${rawData.estimatedValue.toLocaleString("en-IN")}`,
      type: "NEW_LEAD",
      link_url: "/app/leads",
      is_read: false,
    });

    revalidatePath("/app/leads");
    revalidatePath("/app/dashboard");
    revalidatePath("/app/whatsapp");

    return {
      success: true,
      message: "Lead created successfully",
      leadId: lead.id,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error creating lead",
    };
  }
}

export async function updateLeadStatus(
  leadId: string,
  newStatus: LeadStatus
): Promise<LeadActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("leads")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)
      .eq("organization_id", auth.orgId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log status change activity
    await supabase.from("lead_activities").insert({
      organization_id: auth.orgId,
      lead_id: leadId,
      user_id: auth.userId,
      type: "STATUS_CHANGE",
      title: `Status updated to ${newStatus.replace("_", " ")}`,
    });

    revalidatePath("/app/leads");
    revalidatePath("/app/dashboard");
    revalidatePath("/app/whatsapp");

    return { success: true, message: `Status updated to ${newStatus}` };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update status",
    };
  }
}

export async function addLeadActivity(
  leadId: string,
  prevState: LeadActionResult | null,
  formData: FormData
): Promise<LeadActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) {
    return { success: false, error: "Unauthorized access" };
  }

  const rawData = {
    type: (formData.get("type") as LeadActivity["type"]) || "NOTE",
    title: (formData.get("title") as string)?.trim(),
    description: (formData.get("description") as string)?.trim() || "",
    scheduledAt: (formData.get("scheduledAt") as string)?.trim() || "",
  };

  const validation = leadActivitySchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Invalid activity data",
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("lead_activities").insert({
      organization_id: auth.orgId,
      lead_id: leadId,
      user_id: auth.userId,
      type: rawData.type,
      title: rawData.title,
      description: rawData.description || null,
      scheduled_at: rawData.scheduledAt ? new Date(rawData.scheduledAt).toISOString() : null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/app/leads");

    return { success: true, message: "Activity logged successfully" };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to log activity",
    };
  }
}

export async function deleteLead(leadId: string): Promise<LeadActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", leadId)
      .eq("organization_id", auth.orgId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/app/leads");
    revalidatePath("/app/dashboard");
    revalidatePath("/app/whatsapp");

    return { success: true, message: "Lead deleted successfully" };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete lead",
    };
  }
}

export async function getLeadsData(sourceFilter?: LeadSource): Promise<LeadWithActivities[]> {
  try {
    const auth = await getAuthenticatedUserOrg();
    if (!auth) return [];

    const supabase = await createClient();
    let query = supabase
      .from("leads")
      .select("*")
      .eq("organization_id", auth.orgId)
      .order("created_at", { ascending: false });

    if (sourceFilter) {
      query = query.eq("source", sourceFilter);
    }

    const { data: leads, error } = await query;
    if (error || !leads) return [];

    return leads;
  } catch (error) {
    console.error("Error fetching leads:", error);
    return [];
  }
}

export async function getLeadActivities(leadId: string): Promise<LeadActivity[]> {
  try {
    const auth = await getAuthenticatedUserOrg();
    if (!auth) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", leadId)
      .eq("organization_id", auth.orgId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data;
  } catch (error) {
    console.error("Error fetching lead activities:", error);
    return [];
  }
}

export async function getDashboardLeadStats(): Promise<DashboardLeadStats> {
  try {
    const auth = await getAuthenticatedUserOrg();
    if (!auth) {
      return {
        visitorsToday: 0,
        totalVisitors: 0,
        activeVisitors: 0,
        leadsToday: 0,
        whatsAppLeads: 0,
        whatsAppLeadsToday: 0,
        totalLeads: 0,
        recentLeads: [],
      };
    }

    const supabase = await createClient();

    // Fetch all leads for this organization
    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .eq("organization_id", auth.orgId)
      .order("created_at", { ascending: false });

    const allLeads = leads || [];
    const totalLeads = allLeads.length;

    // Calculate leads today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const leadsToday = allLeads.filter((l) => new Date(l.created_at) >= today).length;
    const whatsAppLeads = allLeads.filter((l) => l.source === "WHATSAPP").length;
    const whatsAppLeadsToday = allLeads.filter((l) => l.source === "WHATSAPP" && new Date(l.created_at) >= today).length;
    const recentLeads = allLeads.slice(0, 5);

    // Fetch live website visitor statistics
    const { data: visitors } = await supabase
      .from("website_visitors")
      .select("visitor_id, created_at, last_heartbeat_at")
      .eq("organization_id", auth.orgId);

    const allVisitors = visitors || [];
    const todayVisitors = allVisitors.filter((v) => new Date(v.created_at) >= today);
    const visitorsToday = new Set(todayVisitors.map((v) => v.visitor_id)).size;

    // Active in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeVisitorsList = allVisitors.filter(
      (v) => new Date(v.last_heartbeat_at) >= fiveMinutesAgo
    );
    const activeVisitors = new Set(activeVisitorsList.map((v) => v.visitor_id)).size;

    return {
      visitorsToday,
      totalVisitors: allVisitors.length,
      activeVisitors,
      leadsToday,
      whatsAppLeads,
      whatsAppLeadsToday,
      totalLeads,
      recentLeads,
    };
  } catch (error) {
    console.error("Error calculating dashboard stats:", error);
    return {
      visitorsToday: 0,
      totalVisitors: 0,
      activeVisitors: 0,
      leadsToday: 0,
      whatsAppLeads: 0,
      whatsAppLeadsToday: 0,
      totalLeads: 0,
      recentLeads: [],
    };
  }
}
