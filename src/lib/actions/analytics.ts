"use server";

import { createClient } from "@/lib/supabase/server";
import { AnalyticsSummary, WebsiteVisitor } from "@/types/crm";

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

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const defaultSummary: AnalyticsSummary = {
    activeVisitors: 0,
    pageViewsToday: 0,
    uniqueVisitorsToday: 0,
    totalPageViewsAllTime: 0,
    totalUniqueVisitorsAllTime: 0,
    avgDurationSeconds: 0,
    eventConversionsCount: 0,
    sourcesBreakdown: [],
    deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
    topPages: [],
    recentVisitors: [],
  };

  try {
    const auth = await getAuthenticatedUserOrg();
    if (!auth) return defaultSummary;

    const supabase = await createClient();

    // Fetch all website visitor entries for this organization
    const { data: visitors, error } = await supabase
      .from("website_visitors")
      .select("*")
      .eq("organization_id", auth.orgId)
      .order("created_at", { ascending: false });

    if (error || !visitors) return defaultSummary;

    const allVisitors = visitors as WebsiteVisitor[];
    const totalPageViewsAllTime = allVisitors.length;

    // Unique visitors all time
    const uniqueVisitorIds = new Set(allVisitors.map((v) => v.visitor_id));
    const totalUniqueVisitorsAllTime = uniqueVisitorIds.size;

    // Calculate Active Visitors (heartbeat in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeVisitorsList = allVisitors.filter(
      (v) => new Date(v.last_heartbeat_at) >= fiveMinutesAgo
    );
    const activeVisitors = new Set(activeVisitorsList.map((v) => v.visitor_id)).size;

    // Calculate Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVisitors = allVisitors.filter((v) => new Date(v.created_at) >= today);
    const pageViewsToday = todayVisitors.length;
    const uniqueVisitorsToday = new Set(todayVisitors.map((v) => v.visitor_id)).size;

    // Average duration
    const totalDuration = allVisitors.reduce((sum, v) => sum + (v.duration_seconds || 0), 0);
    const avgDurationSeconds = allVisitors.length > 0 ? Math.round(totalDuration / allVisitors.length) : 0;

    // Sources breakdown
    const sourceCounts: Record<string, number> = {};
    allVisitors.forEach((v) => {
      let sourceName = "Direct / Bookmark";
      const ref = (v.referrer || "").toLowerCase();
      const utm = (v.utm_source || "").toLowerCase();

      if (utm.includes("google") || ref.includes("google.")) {
        sourceName = "Google Search";
      } else if (utm.includes("whatsapp") || ref.includes("whatsapp") || ref.includes("wa.me")) {
        sourceName = "WhatsApp";
      } else if (utm.includes("facebook") || utm.includes("instagram") || ref.includes("facebook") || ref.includes("instagram")) {
        sourceName = "Meta / Instagram";
      } else if (utm.includes("ad") || utm.includes("cpc") || utm.includes("ppc")) {
        sourceName = "Paid Ads";
      } else if (ref && !ref.includes("localhost")) {
        sourceName = "Referral Web";
      }

      sourceCounts[sourceName] = (sourceCounts[sourceName] || 0) + 1;
    });

    const sourcesBreakdown = Object.entries(sourceCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalPageViewsAllTime > 0 ? Math.round((count / totalPageViewsAllTime) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Device breakdown
    const mobileCount = allVisitors.filter((v) => v.device_type === "MOBILE").length;
    const desktopCount = allVisitors.filter((v) => v.device_type === "DESKTOP").length;
    const tabletCount = allVisitors.filter((v) => v.device_type === "TABLET").length;

    const deviceBreakdown = {
      mobile: totalPageViewsAllTime > 0 ? Math.round((mobileCount / totalPageViewsAllTime) * 100) : 0,
      desktop: totalPageViewsAllTime > 0 ? Math.round((desktopCount / totalPageViewsAllTime) * 100) : 0,
      tablet: totalPageViewsAllTime > 0 ? Math.round((tabletCount / totalPageViewsAllTime) * 100) : 0,
    };

    // Top Pages
    const pageCounts: Record<string, number> = {};
    allVisitors.forEach((v) => {
      const path = v.page_url.split("?")[0] || "/";
      pageCounts[path] = (pageCounts[path] || 0) + 1;
    });

    const topPages = Object.entries(pageCounts)
      .map(([url, views]) => ({ url, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Fetch Events (Conversions) count
    const { count: eventsCount } = await supabase
      .from("website_events")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", auth.orgId);

    return {
      activeVisitors,
      pageViewsToday,
      uniqueVisitorsToday,
      totalPageViewsAllTime,
      totalUniqueVisitorsAllTime,
      avgDurationSeconds,
      eventConversionsCount: eventsCount || 0,
      sourcesBreakdown,
      deviceBreakdown,
      topPages,
      recentVisitors: allVisitors.slice(0, 10),
    };
  } catch (error) {
    console.error("Error computing analytics summary:", error);
    return defaultSummary;
  }
}
