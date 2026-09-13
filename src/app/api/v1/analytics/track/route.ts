import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function parseDevice(userAgent: string, width?: number): "MOBILE" | "DESKTOP" | "TABLET" | "OTHER" {
  const ua = userAgent.toLowerCase();
  if (width && width <= 640) return "MOBILE";
  if (width && width <= 1024 && width > 640) return "TABLET";
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return "MOBILE";
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "TABLET";
  return "DESKTOP";
}

function parseBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("chrome") && !ua.includes("edg") && !ua.includes("opr")) return "Chrome";
  if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
  if (ua.includes("firefox")) return "Firefox";
  if (ua.includes("edg")) return "Edge";
  if (ua.includes("opr") || ua.includes("opera")) return "Opera";
  return "Browser";
}

function parseOS(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("win")) return "Windows";
  if (ua.includes("mac")) return "macOS";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS";
  if (ua.includes("linux")) return "Linux";
  return "OS";
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json({ success: false, error: "Empty body" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const {
      orgSlug,
      visitorId,
      sessionId,
      url,
      title,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      durationSeconds,
      isHeartbeat,
      eventName,
      eventData,
      screen,
    } = payload;

    if (!orgSlug || !visitorId || !sessionId) {
      return NextResponse.json(
        { success: false, error: "Missing required tracking parameters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find organization by slug
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, status")
      .eq("slug", orgSlug)
      .single();

    if (orgError || !org || org.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Organization not found or inactive" },
        { status: 404 }
      );
    }

    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || null;
    const deviceType = parseDevice(userAgent, screen?.width);
    const browser = parseBrowser(userAgent);
    const os = parseOS(userAgent);

    if (isHeartbeat) {
      // Update existing session heartbeat and duration
      await supabase
        .from("website_visitors")
        .update({
          duration_seconds: durationSeconds || 0,
          is_active: true,
          last_heartbeat_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)
        .eq("organization_id", org.id);
    } else {
      // Check if session already exists for this page view or insert new
      const { data: existing } = await supabase
        .from("website_visitors")
        .select("id")
        .eq("session_id", sessionId)
        .eq("page_url", url || "/")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("website_visitors")
          .update({
            duration_seconds: durationSeconds || 0,
            is_active: true,
            last_heartbeat_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("website_visitors").insert({
          organization_id: org.id,
          visitor_id: visitorId,
          session_id: sessionId,
          page_url: url || "/",
          page_title: title || null,
          referrer: referrer || null,
          utm_source: utmSource || null,
          utm_medium: utmMedium || null,
          utm_campaign: utmCampaign || null,
          device_type: deviceType,
          browser: browser,
          os: os,
          ip_address: ipAddress,
          duration_seconds: durationSeconds || 0,
          is_active: true,
          last_heartbeat_at: new Date().toISOString(),
        });
      }
    }

    // Log custom event if provided (e.g. WhatsApp button click)
    if (eventName) {
      await supabase.from("website_events").insert({
        organization_id: org.id,
        visitor_id: visitorId,
        session_id: sessionId,
        event_name: eventName,
        event_data: eventData || {},
      });
    }

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Internal tracking error" },
      { status: 500 }
    );
  }
}
