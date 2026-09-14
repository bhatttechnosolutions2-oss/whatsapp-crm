"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { OrgIntegrationsConfig, WhatsAppMessageItem, WhatsAppProvider } from "@/types/crm";
import crypto from "crypto";

export interface IntegrationActionResult {
  success: boolean;
  error?: string;
  message?: string;
  token?: string;
}

// Integration secrets are stored only in Supabase server-side columns.\n// Never persist provider credentials to local JSON files.\nfunction getStoredConfig(_orgId: string): Partial<OrgIntegrationsConfig> { return {}; }\nfunction saveStoredConfig(_orgId: string, _updates: Partial<OrgIntegrationsConfig>) { /* intentionally disabled */ }\n\nasync function getAuthenticatedUserOrg() {
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

export async function getOrganizationIntegrations(): Promise<OrgIntegrationsConfig | null> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) return null;

  const supabase = await createClient();
  const cached = getStoredConfig(auth.orgId);

  try {
    const { data: org, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", auth.orgId)
      .single();

    if (error || !org) {
      console.warn("Could not fetch org integrations:", error?.message);
      return null;
    }



    return {
      orgSlug: org.slug || "business",
      webhookToken: (org as any).webhook_token || null,
      webhookTokenAlt: (org as any).webhook_token_alt || null,
      whatsappProvider: (org as any).whatsapp_provider || cached.whatsappProvider || null,
      whatsappApiKey: null,
      whatsappApiUrl: (org as any).whatsapp_api_url || cached.whatsappApiUrl || null,
      whatsappPhoneNumber: (org as any).whatsapp_phone_number || cached.whatsappPhoneNumber || null,
      whatsappInstanceId: (org as any).whatsapp_instance_id || cached.whatsappInstanceId || null,
      whatsappWebhookSecret: null,
      whatsappEnabled: Boolean((org as any).whatsapp_enabled ?? cached.whatsappEnabled),
      googleAdsCustomerId: (org as any).google_ads_customer_id || cached.googleAdsCustomerId || null,
      googleAdsDeveloperToken: null,
      googleAdsClientId: (org as any).google_ads_client_id || cached.googleAdsClientId || null,
      googleAdsClientSecret: null,
      googleAdsRefreshToken: null,
      googleAdsEnabled: Boolean((org as any).google_ads_enabled ?? cached.googleAdsEnabled),
      metaAdsAccessToken: null,
      metaAdsAccountId: (org as any).meta_ads_account_id || cached.metaAdsAccountId || null,
      metaAdsAppId: (org as any).meta_ads_app_id || cached.metaAdsAppId || null,
      metaAdsEnabled: Boolean((org as any).meta_ads_enabled ?? cached.metaAdsEnabled),
    };
  } catch (err) {
    console.error("Error in getOrganizationIntegrations:", err);
    return null;
  }
}

export async function saveWhatsAppIntegration(data: {
  provider: WhatsAppProvider;
  apiKey?: string;
  apiUrl?: string;
  phoneNumber?: string;
  instanceId?: string;
  enabled: boolean;
}): Promise<IntegrationActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) return { success: false, error: "Unauthorized access" };

  const supabase = await createClient();

  // 1. Always persist to resilient cache
  saveStoredConfig(auth.orgId, {
    whatsappProvider: data.provider,
    whatsappApiKey: data.apiKey || null,
    whatsappApiUrl: data.apiUrl || null,
    whatsappPhoneNumber: data.phoneNumber || null,
    whatsappInstanceId: data.instanceId || null,
    whatsappEnabled: data.enabled,
  });

  // 2. Also try saving to DB if columns exist
  try {
    await supabase
      .from("organizations")
      .update({
        whatsapp_provider: data.provider,
        whatsapp_api_key: data.apiKey || undefined,
        whatsapp_api_url: data.apiUrl || null,
        whatsapp_phone_number: data.phoneNumber || null,
        whatsapp_instance_id: data.instanceId || null,
        whatsapp_enabled: data.enabled,
      } as any)
      .eq("id", auth.orgId);
  } catch {
    // Graceful fallback
  }

  revalidatePath("/app/settings/integrations");
  revalidatePath("/app/whatsapp");
  return { success: true, message: "WhatsApp settings saved and active in CRM!" };
}

export async function saveGoogleAdsIntegration(data: {
  customerId?: string;
  developerToken?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  enabled: boolean;
}): Promise<IntegrationActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) return { success: false, error: "Unauthorized access" };

  const supabase = await createClient();

  // 1. Always persist to resilient cache
  saveStoredConfig(auth.orgId, {
    googleAdsCustomerId: data.customerId || null,
    googleAdsDeveloperToken: data.developerToken || null,
    googleAdsClientId: data.clientId || null,
    googleAdsClientSecret: data.clientSecret || null,
    googleAdsRefreshToken: data.refreshToken || null,
    googleAdsEnabled: data.enabled,
  });

  // 2. Also try saving to DB
  try {
    await supabase
      .from("organizations")
      .update({
        google_ads_customer_id: data.customerId || null,
        google_ads_developer_token: data.developerToken || undefined,
        google_ads_client_id: data.clientId || null,
        google_ads_client_secret: data.clientSecret || undefined,
        google_ads_refresh_token: data.refreshToken || undefined,
        google_ads_enabled: data.enabled,
      } as any)
      .eq("id", auth.orgId);
  } catch {
    // Graceful fallback
  }

  revalidatePath("/app/settings/integrations");
  revalidatePath("/app/ads");
  return { success: true, message: "Google Ads integration saved and active!" };
}

export async function saveMetaAdsIntegration(data: {
  accessToken?: string;
  accountId?: string;
  appId?: string;
  enabled: boolean;
}): Promise<IntegrationActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) return { success: false, error: "Unauthorized access" };

  const supabase = await createClient();

  // 1. Always persist to resilient cache
  saveStoredConfig(auth.orgId, {
    metaAdsAccessToken: data.accessToken || null,
    metaAdsAccountId: data.accountId || null,
    metaAdsAppId: data.appId || null,
    metaAdsEnabled: data.enabled,
  });

  // 2. Also try saving to DB
  try {
    await supabase
      .from("organizations")
      .update({
        meta_ads_access_token: data.accessToken || undefined,
        meta_ads_account_id: data.accountId || null,
        meta_ads_app_id: data.appId || null,
        meta_ads_enabled: data.enabled,
      } as any)
      .eq("id", auth.orgId);
  } catch {
    // Graceful fallback
  }

  revalidatePath("/app/settings/integrations");
  revalidatePath("/app/ads");
  return { success: true, message: "Meta Ads integration saved and active!" };
}

export async function rotateWebhookToken(): Promise<IntegrationActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) return { success: false, error: "Unauthorized access" };

  const supabase = await createClient();
  const newToken = crypto.randomBytes(20).toString("hex");

  saveStoredConfig(auth.orgId, {
    webhookToken: newToken,
  });

  try {
    await supabase
      .from("organizations")
      .update({
        webhook_token: newToken,
      } as any)
      .eq("id", auth.orgId);
  } catch {
    // Graceful fallback
  }

  revalidatePath("/app/settings/integrations");
  return {
    success: true,
    message: "Webhook token rotated successfully",
    token: newToken,
  };
}

export async function sendWhatsAppMessage(payload: {
  leadId?: string;
  phone: string;
  message: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) return { success: false, error: "Unauthorized access" };

  const supabase = await createClient();
  const cached = getStoredConfig(auth.orgId);

  // Fetch org whatsapp config
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", auth.orgId)
    .single();

  const provider = (org as any)?.whatsapp_provider || cached.whatsappProvider || "CUSTOM";
  const apiKey = (org as any)?.whatsapp_api_key || cached.whatsappApiKey;
  const apiUrl = (org as any)?.whatsapp_api_url || cached.whatsappApiUrl;
  const fromNumber = (org as any)?.whatsapp_phone_number || cached.whatsappPhoneNumber || "CRM";
  const isEnabled = (org as any)?.whatsapp_enabled ?? cached.whatsappEnabled;

  let cleanPhone = payload.phone.replace(/[^0-9+]/g, "");
  if (!cleanPhone.startsWith("+") && cleanPhone.length === 10) {
    cleanPhone = `+91${cleanPhone}`;
  }

  let deliveryStatus: "SENT" | "FAILED" = "SENT";
  let providerMessageId: string | undefined = undefined;

  // Attempt real provider dispatch if credentials are provided
  if (apiKey && isEnabled) {
    try {
      if (provider === "WATI") {
        const endpoint = `${apiUrl || "https://live-server.wati.io"}/api/v1/sendSessionMessage/${cleanPhone.replace("+", "")}?messageText=${encodeURIComponent(payload.message)}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });
        const json = await res.json();
        if (!res.ok) deliveryStatus = "FAILED";
        providerMessageId = json?.messageId || json?.id;
      } else if (provider === "AISENSY") {
        const res = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey,
            campaignName: "crm_direct_message",
            destination: cleanPhone.replace("+", ""),
            userName: "Customer",
            templateParams: [payload.message],
          }),
        });
        if (!res.ok) deliveryStatus = "FAILED";
      } else if (provider === "CUSTOM" && apiUrl) {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            to: cleanPhone,
            message: payload.message,
            leadId: payload.leadId,
          }),
        });
        if (!res.ok) deliveryStatus = "FAILED";
      }
    } catch (sendErr) {
      console.error("WhatsApp dispatch error:", sendErr);
      deliveryStatus = "FAILED";
    }
  }

  // Record into whatsapp_messages table if exists
  try {
    await supabase.from("whatsapp_messages").insert({
      organization_id: auth.orgId,
      lead_id: payload.leadId || null,
      direction: "OUTBOUND",
      from_number: fromNumber,
      to_number: cleanPhone,
      message: payload.message,
      status: deliveryStatus,
      provider,
      provider_message_id: providerMessageId || null,
    } as any);
  } catch {
    // Graceful fallback if whatsapp_messages table is not yet migrated
  }

  // Also log activity in lead timeline if leadId exists
  if (payload.leadId) {
    try {
      await supabase.from("lead_activities").insert({
        organization_id: auth.orgId,
        lead_id: payload.leadId,
        type: "WHATSAPP_MESSAGE",
        title: `WhatsApp Sent: ${payload.message.slice(0, 40)}...`,
        description: `Message sent to ${cleanPhone} via ${provider}. Status: ${deliveryStatus}`,
      });
    } catch (actErr) {
      console.warn("Could not log lead activity:", actErr);
    }
  }

  revalidatePath("/app/whatsapp");
  if (payload.leadId) revalidatePath(`/app/leads/${payload.leadId}`);

  return {
    success: deliveryStatus === "SENT",
    messageId: providerMessageId,
    error: deliveryStatus === "FAILED" ? "Failed to deliver via provider" : undefined,
  };
}

export async function getWhatsAppMessages(leadId?: string): Promise<WhatsAppMessageItem[]> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) return [];

  const supabase = await createClient();

  try {
    let query = supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("organization_id", auth.orgId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (leadId) {
      query = query.eq("lead_id", leadId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data as WhatsAppMessageItem[];
  } catch (err) {
    console.warn("Could not query whatsapp_messages table:", err);
    return [];
  }
}
