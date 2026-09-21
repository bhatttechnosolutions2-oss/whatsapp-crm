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
      .select("google_ads_enabled, google_ads_customer_id, google_ads_developer_token, google_ads_refresh_token")
      .eq("id", member.organization_id)
      .maybeSingle();

    const isConnected = !!(
      (org as any)?.google_ads_enabled &&
      (org as any)?.google_ads_customer_id &&
      (org as any)?.google_ads_developer_token &&
      (org as any)?.google_ads_refresh_token
    );

    return NextResponse.json({
      success: true,
      connected: isConnected,
      message: isConnected
        ? "Google Ads account connected"
        : "Connect your Google Ads account to view live performance.",
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

    // Fetch org google ads config
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .maybeSingle();

    const customerId = (org as any)?.google_ads_customer_id;
    const devToken = (org as any)?.google_ads_developer_token;
    const refreshToken = (org as any)?.google_ads_refresh_token;
    const isEnabled = (org as any)?.google_ads_enabled;

    // Check if Google Ads is genuinely configured
    if (!isEnabled || !customerId || !devToken || !refreshToken) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: "Google Ads account is not connected. Connect your Google Ads account to view live performance.",
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

    // Attempt real Google Ads API sync with provided credentials
    try {
      const cleanCustomerId = customerId.replace(/[^0-9]/g, "");
      const query = `SELECT campaign.id, campaign.name, campaign.status, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE segments.date DURING LAST_7_DAYS`;

      const res = await fetch(
        `https://googleads.googleapis.com/v16/customers/${cleanCustomerId}/googleAds:searchStream`,
        {
          method: "POST",
          headers: {
            "developer-token": devToken,
            Authorization: `Bearer ${refreshToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          for (const batch of json) {
            for (const row of batch.results || []) {
              const spend = Math.round((Number(row.metrics?.costMicros || 0) / 1000000) * 100) / 100;
              const leads = Number(row.metrics?.conversions || 0);
              campaignsToSync.push({
                campaign_name: row.campaign?.name || "Search Campaign",
                status: row.campaign?.status === "ENABLED" ? "ACTIVE" : "PAUSED",
                spend,
                impressions: Number(row.metrics?.impressions || 0),
                clicks: Number(row.metrics?.clicks || 0),
                leads_generated: leads,
                cost_per_lead: leads > 0 ? Math.round((spend / leads) * 100) / 100 : 0,
              });
            }
          }
        }
      }
    } catch (apiErr) {
      console.warn("Google Ads API live pull error:", apiErr);
    }

    // If connected but no campaigns exist in Google Ads account
    if (campaignsToSync.length === 0) {
      return NextResponse.json({
        success: true,
        connected: true,
        message: "No campaigns found.",
        count: 0,
        campaigns: [],
      });
    }

    // Upsert verified campaigns into ad_campaigns
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
          platform: "GOOGLE_ADS",
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
      message: `Successfully synchronized ${campaignsToSync.length} Google Ads campaigns`,
      count: campaignsToSync.length,
      campaigns: campaignsToSync,
    });
  } catch (err: any) {
    console.error("Google Ads sync handler error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Sync failed" },
      { status: 500 }
    );
  }
}
