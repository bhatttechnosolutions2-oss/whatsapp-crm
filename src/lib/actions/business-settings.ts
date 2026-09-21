"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getCurrentUserContext } from "./profile";
import { z } from "zod";

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

const businessSettingsSchema = z.object({
  name: z.string().trim().min(2, "Business name is required").max(100),
  businessType: z.string().trim().default("OTHER"),
  website: z.string().trim().max(255).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
  email: z.string().trim().email("Invalid email").or(z.literal("")).optional().default(""),
  address: z.string().trim().max(255).optional().default(""),
  city: z.string().trim().max(100).optional().default(""),
  state: z.string().trim().max(100).optional().default(""),
  country: z.string().trim().max(100).default("India"),
  services: z.array(z.string()).default([]),
  notificationPrefs: z.record(z.boolean()).default({}),
});

export type BusinessSettingsInput = z.input<typeof businessSettingsSchema>;

export async function getBusinessSettings() {
  const context = await getCurrentUserContext();
  if (!context || !context.organization?.id) {
    return null;
  }

  const orgId = context.organization.id;
  const admin = getSupabaseAdmin();
  const supabase = await createClient();
  const client: any = admin || supabase;

  const { data: org, error } = await client
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (error || !org) return null;

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    businessType: (org as any).business_type || "OTHER",
    website: org.website || "",
    phone: org.phone || "",
    email: org.email || "",
    address: (org as any).address || "",
    city: (org as any).city || "",
    state: (org as any).state || "",
    country: (org as any).country || "India",
    plan: (org as any).plan || "FREE",
    status: org.status,
    services: Array.isArray((org as any).services) ? (org as any).services : [],
    notificationPrefs: (org as any).notification_prefs || {
      new_lead: true,
      follow_up: true,
      whatsapp_alerts: true,
      email_summary: false,
    },
    webhookToken: (org as any).webhook_token || "",
  };
}

export async function updateBusinessSettings(input: BusinessSettingsInput) {
  const context = await getCurrentUserContext();
  if (!context || !context.organization?.id) {
    return { success: false, error: "Unauthorized: Active session required" };
  }

  const parseResult = businessSettingsSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Validation failed",
    };
  }

  const data = parseResult.data;
  const orgId = context.organization.id;
  const admin = getSupabaseAdmin();
  const supabase = await createClient();
  const client: any = admin || supabase;

  // IMPORTANT: Client can NEVER update plan, status, or slug directly
  const payload: Record<string, any> = {
    name: data.name,
    business_type: data.businessType,
    website: data.website || null,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    country: data.country || "India",
    services: data.services,
    notification_prefs: data.notificationPrefs,
    updated_at: new Date().toISOString(),
  };

  const { error } = await client
    .from("organizations")
    .update(payload)
    .eq("id", orgId);

  if (error) {
    // Fallback: update core columns if schema migration pending
    const corePayload = {
      name: data.name,
      website: data.website || null,
      phone: data.phone || null,
      email: data.email || null,
      updated_at: new Date().toISOString(),
    };

    const { error: fbErr } = await client
      .from("organizations")
      .update(corePayload)
      .eq("id", orgId);

    if (fbErr) {
      return { success: false, error: fbErr.message };
    }
  }

  // Audit Log
  try {
    await client.from("audit_logs").insert({
      organization_id: orgId,
      user_id: context.user.id,
      action: "ORGANIZATION_UPDATED",
      entity_type: "ORGANIZATION",
      entity_id: orgId,
      details: {
        updated_fields: Object.keys(payload),
      },
    });
  } catch {
    // non-blocking
  }

  revalidatePath("/app/settings/business");
  revalidatePath("/app/settings");
  revalidatePath("/app/dashboard");

  return { success: true, message: "Business settings updated successfully" };
}
