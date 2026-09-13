"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { clientSchema } from "@/lib/validations/projects";
import { Client, ClientWithProjects } from "@/types/crm";

export interface ClientActionResult {
  success: boolean;
  error?: string;
  message?: string;
  clientId?: string;
}

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

export async function createClientRecord(
  prevState: ClientActionResult | null,
  formData: FormData
): Promise<ClientActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) {
    return { success: false, error: "Unauthorized access" };
  }

  const rawData = {
    fullName: (formData.get("fullName") as string)?.trim(),
    phone: (formData.get("phone") as string)?.trim(),
    email: (formData.get("email") as string)?.trim() || "",
    companyName: (formData.get("companyName") as string)?.trim() || "",
    websiteUrl: (formData.get("websiteUrl") as string)?.trim() || "",
    status: (formData.get("status") as Client["status"]) || "ACTIVE",
  };

  const validation = clientSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Validation failed",
    };
  }

  try {
    const supabase = await createClient();

    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        organization_id: auth.orgId,
        full_name: validation.data.fullName,
        phone: validation.data.phone,
        email: validation.data.email || null,
        company_name: validation.data.companyName || null,
        website_url: validation.data.websiteUrl || null,
        status: validation.data.status,
      })
      .select("id")
      .single();

    if (error || !client) {
      return { success: false, error: error?.message || "Failed to create client" };
    }

    revalidatePath("/app/clients");
    revalidatePath("/app/projects");

    return {
      success: true,
      message: "Client added successfully",
      clientId: client.id,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error creating client",
    };
  }
}

export async function convertLeadToClient(leadId: string): Promise<ClientActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const supabase = await createClient();

    // Fetch lead details
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .eq("organization_id", auth.orgId)
      .single();

    if (leadError || !lead) {
      return { success: false, error: "Lead not found" };
    }

    // Insert new client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        organization_id: auth.orgId,
        lead_id: lead.id,
        full_name: lead.full_name,
        phone: lead.phone,
        email: lead.email || null,
        company_name: lead.company || null,
        status: "ACTIVE",
      })
      .select("id")
      .single();

    if (clientError || !client) {
      return { success: false, error: clientError?.message || "Failed to convert lead" };
    }

    // Update lead status to WON
    await supabase
      .from("leads")
      .update({ status: "WON", updated_at: new Date().toISOString() })
      .eq("id", leadId);

    // Log activity
    await supabase.from("lead_activities").insert({
      organization_id: auth.orgId,
      lead_id: leadId,
      user_id: auth.userId,
      type: "STATUS_CHANGE",
      title: "Converted to Client",
      description: "Lead successfully converted to an active business client record.",
    });

    revalidatePath("/app/clients");
    revalidatePath("/app/leads");
    revalidatePath("/app/projects");
    revalidatePath("/app/dashboard");

    return {
      success: true,
      message: "Lead successfully converted to Client!",
      clientId: client.id,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Conversion failed",
    };
  }
}

export async function getClientsData(): Promise<ClientWithProjects[]> {
  try {
    const auth = await getAuthenticatedUserOrg();
    if (!auth) return [];

    const supabase = await createClient();

    const { data: clients, error } = await supabase
      .from("clients")
      .select("*")
      .eq("organization_id", auth.orgId)
      .order("created_at", { ascending: false });

    if (error || !clients) return [];

    // Fetch project counts
    const { data: projects } = await supabase
      .from("projects")
      .select("id, client_id, status")
      .eq("organization_id", auth.orgId);

    const allProjects = projects || [];

    return clients.map((c) => {
      const clientProjects = allProjects.filter((p) => p.client_id === c.id);
      return {
        ...c,
        projectCount: clientProjects.length,
      };
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}
