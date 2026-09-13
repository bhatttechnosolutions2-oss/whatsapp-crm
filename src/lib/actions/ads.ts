"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdCampaignSchema, CreateAdCampaignInput } from "@/lib/validations/ads";
import { AdsSummary, AdCampaign } from "@/types/crm";

export interface AdActionResult {
  success: boolean;
  error?: string;
  message?: string;
  campaignId?: string;
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

export async function createAdCampaign(
  payload: CreateAdCampaignInput
): Promise<AdActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) {
    return { success: false, error: "Unauthorized access" };
  }

  const parseResult = createAdCampaignSchema.safeParse(payload);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Invalid campaign data",
    };
  }

  const { platform, campaign_name, status, spend, impressions, clicks, leads_generated } =
    parseResult.data;

  const costPerLead =
    leads_generated > 0 ? Math.round((spend / leads_generated) * 100) / 100 : 0;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_campaigns")
    .insert({
      organization_id: auth.orgId,
      platform,
      campaign_name,
      status,
      spend,
      impressions,
      clicks,
      leads_generated,
      cost_per_lead: costPerLead,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Ad campaign creation error:", error);
    return { success: false, error: error?.message || "Failed to save campaign" };
  }

  revalidatePath("/app/ads");
  return { success: true, message: "Campaign created successfully", campaignId: data.id };
}

export async function getAdsCampaignSummary(): Promise<AdsSummary> {
  const auth = await getAuthenticatedUserOrg();
  const emptySummary: AdsSummary = {
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalLeads: 0,
    avgCostPerLead: 0,
    overallCTR: 0,
    googleSpend: 0,
    metaSpend: 0,
    campaigns: [],
  };

  if (!auth) return emptySummary;

  const supabase = await createClient();
  const { data: campaignsData, error } = await supabase
    .from("ad_campaigns")
    .select("*")
    .eq("organization_id", auth.orgId)
    .order("created_at", { ascending: false });

  if (error || !campaignsData) {
    return emptySummary;
  }

  const campaigns = (campaignsData as AdCampaign[]) || [];

  let totalSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalLeads = 0;
  let googleSpend = 0;
  let metaSpend = 0;

  campaigns.forEach((c) => {
    const spend = Number(c.spend) || 0;
    const imps = Number(c.impressions) || 0;
    const clicks = Number(c.clicks) || 0;
    const leads = Number(c.leads_generated) || 0;

    totalSpend += spend;
    totalImpressions += imps;
    totalClicks += clicks;
    totalLeads += leads;

    if (c.platform === "GOOGLE_ADS") {
      googleSpend += spend;
    } else if (c.platform === "META_ADS") {
      metaSpend += spend;
    }
  });

  const avgCostPerLead =
    totalLeads > 0 ? Math.round((totalSpend / totalLeads) * 100) / 100 : 0;
  const overallCTR =
    totalImpressions > 0
      ? Math.round((totalClicks / totalImpressions) * 10000) / 100
      : 0;

  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    totalLeads,
    avgCostPerLead,
    overallCTR,
    googleSpend,
    metaSpend,
    campaigns,
  };
}
