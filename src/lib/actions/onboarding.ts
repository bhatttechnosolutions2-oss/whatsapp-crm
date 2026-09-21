"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getCurrentUserContext } from "./profile";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey || url.includes("placeholder") || serviceKey.includes("your-supabase")) {
    return null;
  }
  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface OnboardingState {
  organizationId: string;
  businessName: string;
  slug: string;
  businessType: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  plan: string;
  services: string[];
  leadSources: string[];
  notificationPrefs: {
    new_lead: boolean;
    follow_up: boolean;
    whatsapp_alerts: boolean;
    email_summary: boolean;
  };
  onboardingCompleted: boolean;
  onboardingStep: number;
  webhookToken: string;
  role: string;
}

export async function getOnboardingState(): Promise<OnboardingState | null> {
  const context = await getCurrentUserContext();
  if (!context || !context.organization?.id) {
    return null;
  }

  const orgId = context.organization.id;
  const admin = getSupabaseAdmin();
  const supabase = await createClient();

  const client: any = admin || supabase;
  const { data: org } = await client
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (!org) return null;

  return {
    organizationId: org.id,
    businessName: org.name || "",
    slug: org.slug || "",
    businessType: (org as any).business_type || "OTHER",
    website: org.website || "",
    phone: org.phone || "",
    email: org.email || "",
    address: (org as any).address || "",
    city: (org as any).city || "",
    state: (org as any).state || "",
    country: (org as any).country || "India",
    plan: (org as any).plan || "FREE",
    services: Array.isArray((org as any).services) ? (org as any).services : [],
    leadSources: Array.isArray((org as any).lead_sources) ? (org as any).lead_sources : [],
    notificationPrefs: (org as any).notification_prefs || {
      new_lead: true,
      follow_up: true,
      whatsapp_alerts: true,
      email_summary: false,
    },
    onboardingCompleted: !!(org as any).onboarding_completed,
    onboardingStep: Number((org as any).onboarding_step) || 1,
    webhookToken: (org as any).webhook_token || "",
    role: context.membership.role,
  };
}

export async function saveOnboardingStep(
  step: number,
  payload: {
    businessName?: string;
    businessType?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    services?: string[];
    leadSources?: string[];
    notificationPrefs?: Record<string, boolean>;
  }
) {
  const context = await getCurrentUserContext();
  if (!context || !context.organization?.id) {
    return { success: false, error: "Unauthorized: Active session required" };
  }

  const orgId = context.organization.id;
  const admin = getSupabaseAdmin();
  const supabase = await createClient();
  const client: any = admin || supabase;

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.businessName) updateData.name = payload.businessName;
  if (payload.businessType) updateData.business_type = payload.businessType;
  if (payload.website !== undefined) updateData.website = payload.website;
  if (payload.phone !== undefined) updateData.phone = payload.phone;
  if (payload.email !== undefined) updateData.email = payload.email;
  if (payload.address !== undefined) updateData.address = payload.address;
  if (payload.city !== undefined) updateData.city = payload.city;
  if (payload.state !== undefined) updateData.state = payload.state;
  if (payload.country !== undefined) updateData.country = payload.country;
  if (payload.services !== undefined) updateData.services = payload.services;
  if (payload.leadSources !== undefined) updateData.lead_sources = payload.leadSources;
  if (payload.notificationPrefs !== undefined) updateData.notification_prefs = payload.notificationPrefs;

  // Advance step if greater than current
  updateData.onboarding_step = Math.min(Math.max(step + 1, 1), 7);

  const { error } = await client
    .from("organizations")
    .update(updateData)
    .eq("id", orgId);

  if (error) {
    // If optional columns failed (e.g. schema migration pending), update core fields
    const coreUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
    if (payload.businessName) coreUpdate.name = payload.businessName;
    if (payload.website !== undefined) coreUpdate.website = payload.website;
    if (payload.phone !== undefined) coreUpdate.phone = payload.phone;
    if (payload.email !== undefined) coreUpdate.email = payload.email;

    const { error: coreErr } = await client
      .from("organizations")
      .update(coreUpdate)
      .eq("id", orgId);

    if (coreErr) {
      return { success: false, error: coreErr.message };
    }
  }

  revalidatePath("/app/onboarding");
  revalidatePath("/app/dashboard");

  return { success: true, nextStep: updateData.onboarding_step };
}

export async function completeOnboarding() {
  const context = await getCurrentUserContext();
  if (!context || !context.organization?.id) {
    return { success: false, error: "Unauthorized: Active session required" };
  }

  const orgId = context.organization.id;
  const admin = getSupabaseAdmin();
  const supabase = await createClient();
  const client: any = admin || supabase;

  const { error } = await client
    .from("organizations")
    .update({
      onboarding_completed: true,
      onboarding_step: 7,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);

  if (error) {
    // Graceful fallback if column not yet added
    console.error("completeOnboarding notice:", error.message);
  }

  // Audit log
  try {
    await client.from("audit_logs").insert({
      organization_id: orgId,
      user_id: context.user.id,
      action: "ONBOARDING_COMPLETED",
      entity_type: "ORGANIZATION",
      entity_id: orgId,
      details: {
        completed_at: new Date().toISOString(),
        role: context.membership.role,
      },
    });
  } catch {
    // non-blocking
  }

  revalidatePath("/app/onboarding");
  revalidatePath("/app/dashboard");

  return { success: true };
}
