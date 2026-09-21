import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ success: false, error: "No active organization" }, { status: 403 });
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("meta_ads_enabled, meta_ads_access_token, meta_ads_account_id")
      .eq("id", member.organization_id)
      .maybeSingle();

    const isConnected = !!(
      (org as any)?.meta_ads_enabled &&
      (org as any)?.meta_ads_access_token &&
      (org as any)?.meta_ads_account_id
    );

    return NextResponse.json({
      success: true,
      connected: isConnected,
      message: isConnected
        ? "Meta Ads account connected"
        : "Connect your Meta Ads account to view live performance.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Status check failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ success: false, error: "No active organization" }, { status: 403 });
    }

    const orgId = member.organization_id;

    // Fetch org meta ads config
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .maybeSingle();

    const accessToken = (org as any)?.meta_ads_access_token;
    const accountId = (org as any)?.meta_ads_account_id;
    const isEnabled = (org as any)?.meta_ads_enabled;

    // Check if Meta Ads is genuinely configured
    if (!isEnabled || !accessToken || !accountId) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: "Meta Ads account is not connected. Connect your Meta Ads account to view live performance.",
        count: 0,
        campaigns: [],
      });
    }

    let campaignsToSync: Array<{
      campaign_name: string;
      status: "ACTIVE" | "PAUSED";
      spend: number;
      impressions: number;
      clicks: number;
      leads_generated: number;
      cost_per_lead: number;
    }> = [];

    // Attempt real Meta Graph API sync if configured
    try {
      const cleanAccountId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
      const metaUrl = `https://graph.facebook.com/v19.0/${cleanAccountId}/insights?fields=campaign_name,impressions,clicks,spend,actions&date_preset=last_7d&access_token=${accessToken}`;

      const res = await fetch(metaUrl);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          for (const item of json.data) {
            const spend = Number(item.spend || 0);
            const leadAction = item.actions?.find(
              (a: any) =>
                a.action_type === "lead" ||
                a.action_type === "onsite_conversion.lead_grouped"
            );
            const leads = Number(leadAction?.value || 0);

            campaignsToSync.push({
              campaign_name: item.campaign_name || "Meta Ad Campaign",
              status: "ACTIVE" as const,
              spend,
              impressions: Number(item.impressions || 0),
              clicks: Number(item.clicks || 0),
              leads_generated: leads,
              cost_per_lead: leads > 0 ? Math.round((spend / leads) * 100) / 100 : 0,
            });
          }
        }
      }
    } catch (apiErr) {
      console.warn("Meta Ads API live pull error:", apiErr);
    }

    // If connected but no campaigns found
    if (campaignsToSync.length === 0) {
      return NextResponse.json({
        success: true,
        connected: true,
        message: "No campaigns found.",
        count: 0,
        campaigns: [],
      });
    }

    // Upsert into ad_campaigns
    for (const c of campaignsToSync) {
      const { data: existing } = await supabase
        .from("ad_campaigns")
        .select("id")
        .eq("organization_id", orgId)
        .eq("campaign_name", c.campaign_name)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("ad_campaigns")
          .update({
            spend: c.spend,
            impressions: c.impressions,
            clicks: c.clicks,
            leads_generated: c.leads_generated,
            cost_per_lead: c.cost_per_lead,
            status: c.status as any,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("ad_campaigns").insert({
          organization_id: orgId,
          platform: "META_ADS",
          campaign_name: c.campaign_name,
          status: c.status as any,
          spend: c.spend,
          impressions: c.impressions,
          clicks: c.clicks,
          leads_generated: c.leads_generated,
          cost_per_lead: c.cost_per_lead,
        });
      }
    }

    return NextResponse.json({
      success: true,
      connected: true,
      message: `Successfully synchronized ${campaignsToSync.length} Meta Ads campaigns`,
      count: campaignsToSync.length,
      campaigns: campaignsToSync,
    });
  } catch (err: any) {
    console.error("Meta Ads sync handler error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Sync failed" },
      { status: 500 }
    );
  }
}
