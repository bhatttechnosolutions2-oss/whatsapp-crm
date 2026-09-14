import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

function corsResponse(body: any, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    },
  });
}

export async function OPTIONS() {
  return corsResponse({ status: "ok" });
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, any> = {};

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      formData.forEach((val, key) => {
        const cleanKey = key.replace(/^form_fields\[(.*)\]$/, "$1");
        body[cleanKey] = typeof val === "string" ? val.trim() : val;
      });
    }

    const tokenOrSlug = body.webhook_token || body.token;

    if (!tokenOrSlug) {
      return corsResponse(
        { success: false, error: "Missing required 'webhook_token' or 'orgSlug' identifier" },
        400
      );
    }

    // Auto-map fields
    const fullName =
      body.fullName ||
      body.full_name ||
      body.name ||
      body["your-name"] ||
      [body.firstName || body.first_name, body.lastName || body.last_name].filter(Boolean).join(" ") ||
      "Website Inquiry";

    const phone =
      body.phone ||
      body.phoneNumber ||
      body.phone_number ||
      body.mobile ||
      body.tel ||
      body["your-phone"] ||
      body.whatsapp ||
      "";

    const email =
      body.email ||
      body.emailAddress ||
      body.email_address ||
      body["your-email"] ||
      "";

    const company = body.company || body.company_name || body.business || "";
    const message = body.notes || body.message || body.comments || body["your-message"] || "";
    const estimatedValue = Number(body.estimatedValue || body.estimated_value || body.budget || 0);

    if (!phone && !email) {
      return corsResponse(
        { success: false, error: "Phone or email is required" },
        422
      );
    }

    const supabase = createAdminClient();

    // Public ingestion is authenticated only by a high-entropy webhook token.
    if (typeof tokenOrSlug !== "string" || tokenOrSlug.length < 24 || tokenOrSlug.length > 200) {
      return corsResponse({ success: false, error: "Valid webhook token required" }, 401);
    }

    const supabase = createAdminClient();
    const { data: orgs, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("webhook_token" as any, tokenOrSlug)
      .eq("status", "ACTIVE")
      .limit(1);

    const org: any = orgs?.[0] || null;
    if (orgError || !org) {
      return corsResponse({ success: false, error: "Invalid webhook token" }, 401);
    }

    // Insert lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        organization_id: org.id,
        full_name: fullName,
        phone: phone || "Not Provided",
        email: email || null,
        company: company || null,
        source: body.source || "WEBSITE_FORM",
        status: "NEW",
        estimated_value: isNaN(estimatedValue) ? 0 : estimatedValue,
        notes: message || null,
      })
      .select("id")
      .single();

    if (leadError || !lead) {
      return corsResponse(
        { success: false, error: "Failed to create lead entry" },
        500
      );
    }

    // Insert initial activity
    try {
      await supabase.from("lead_activities").insert({
        organization_id: org.id,
        lead_id: lead.id,
        type: "NOTE",
        title: `Ingested via ${body.source || "Website Form"}`,
        description: message || "Lead automatically captured via Web API",
      });
    } catch {
      // ignore
    }

    // Insert notification
    try {
      await supabase.from("notifications").insert({
        organization_id: org.id,
        type: "NEW_LEAD",
        title: `🌐 New Form Lead: ${fullName}`,
        message: `Phone: ${phone || "N/A"} • Email: ${email || "N/A"}`,
        link_url: `/app/leads`,
        is_read: false,
      });
    } catch {
      // ignore
    }

    return corsResponse(
      {
        success: true,
        message: "Lead successfully recorded",
        leadId: lead.id,
      },
      201
    );
  } catch (err: any) {
    return corsResponse(
      {
        success: false,
        error: err?.message || "Internal server error",
      },
      500
    );
  }
}
