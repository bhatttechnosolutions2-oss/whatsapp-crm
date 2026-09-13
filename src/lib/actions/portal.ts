"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ClientPortalData, ProjectWithDetails, InvoiceWithDetails, Client } from "@/types/crm";
import { FeedbackType } from "@/types/database";

export interface PortalActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

export async function portalLogin(
  prevState: PortalActionResult | null,
  formData: FormData
): Promise<PortalActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim();

  if (!email && !phone) {
    return { success: false, error: "Please enter your registered email or phone number" };
  }

  const supabase = await createClient();

  // Find client record matching email or phone
  let query = supabase.from("clients").select("id, organization_id, full_name, email, phone").eq("status", "ACTIVE");
  if (email) {
    query = query.eq("email", email);
  } else if (phone) {
    query = query.eq("phone", phone);
  }

  const { data: client, error } = await query.maybeSingle();

  if (error || !client) {
    return {
      success: false,
      error: "No active client portal record found with these details. Please contact your account manager.",
    };
  }

  // Set portal session cookie
  const cookieStore = await (await import("next/headers")).cookies();
  cookieStore.set("portal_client_id", client.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  redirect("/portal/dashboard");
}

export async function portalSignOut() {
  const cookieStore = await (await import("next/headers")).cookies();
  cookieStore.delete("portal_client_id");
  redirect("/portal/login");
}

export async function getClientPortalData(): Promise<ClientPortalData | null> {
  const cookieStore = await (await import("next/headers")).cookies();
  const clientId = cookieStore.get("portal_client_id")?.value;

  if (!clientId) return null;

  const supabase = await createClient();

  // 1. Fetch Client info
  const { data: clientData, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();

  if (clientError || !clientData) return null;

  const client = clientData as Client;

  // 2. Fetch Client Projects with tasks and revisions
  const { data: projectsData } = await supabase
    .from("projects")
    .select(`
      *,
      revisions:project_revisions(*),
      tasks:project_tasks(*)
    `)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  const projects = (projectsData as unknown as ProjectWithDetails[]) || [];

  // 3. Fetch Client Invoices with line items
  const { data: invoicesData } = await supabase
    .from("invoices")
    .select(`
      *,
      items:invoice_items(*)
    `)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  const invoices = (invoicesData as unknown as InvoiceWithDetails[]) || [];

  return {
    client,
    projects,
    invoices,
  };
}

export async function submitClientRevision(
  formData: FormData
): Promise<PortalActionResult> {
  const cookieStore = await (await import("next/headers")).cookies();
  const clientId = cookieStore.get("portal_client_id")?.value;

  if (!clientId) {
    return { success: false, error: "Unauthorized portal session" };
  }

  const projectId = formData.get("projectId") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const pageUrl = (formData.get("pageUrl") as string)?.trim();
  const feedbackType = (formData.get("feedbackType") as FeedbackType) || "CONTENT_CHANGE";

  if (!projectId || !title || !description) {
    return { success: false, error: "Please fill in the revision title and description" };
  }

  const supabase = await createClient();

  // Verify project belongs to client
  const { data: project } = await supabase
    .from("projects")
    .select("id, organization_id, name")
    .eq("id", projectId)
    .eq("client_id", clientId)
    .single();

  if (!project) {
    return { success: false, error: "Invalid project" };
  }

  // Insert Revision
  const { error } = await supabase.from("project_revisions").insert({
    organization_id: project.organization_id,
    project_id: projectId,
    title,
    description,
    page_url: pageUrl || null,
    feedback_type: feedbackType,
    status: "PENDING",
  });

  if (error) {
    console.error("Client revision error:", error);
    return { success: false, error: "Failed to submit revision" };
  }

  // Create In-App Notification for Agency Team
  await supabase.from("notifications").insert({
    organization_id: project.organization_id,
    title: `Client Revision: ${project.name}`,
    message: `${title} - "${description.substring(0, 80)}..."`,
    type: "REVISION_REQUESTED",
    link_url: `/app/projects/${projectId}`,
    is_read: false,
  });

  revalidatePath("/portal/dashboard");
  revalidatePath(`/app/projects/${projectId}`);
  return { success: true, message: "Revision submitted successfully to your project team" };
}
