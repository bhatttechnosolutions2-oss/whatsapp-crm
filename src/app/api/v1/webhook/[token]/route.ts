import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// CORS Response Helper
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

// OPTIONS handler for browser pre-flight requests (Elementor / custom forms)
export async function OPTIONS() {
  return corsResponse({ status: "ok" });
}

// GET handler for webhook ping/verification
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return corsResponse({
    success: true,
    message: "CRM Webhook Endpoint is online and ready to receive form leads.",
    tokenReceived: token ? `${token.slice(0, 4)}...${token.slice(-4)}` : "none",
    supportedMethods: ["POST"],
    acceptedFormats: ["application/json", "application/x-www-form-urlencoded", "multipart/form-data"],
  });
}

// Helper to extract fields from JSON or Form/Multipart data
async function parsePayload(request: NextRequest): Promise<Record<string, any>> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await request.json();
    } catch {
      return {};
    }
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    try {
      const formData = await request.formData();
      const obj: Record<string, any> = {};
      formData.forEach((val, key) => {
        // Handle field arrays like form_fields[name]
        const cleanKey = key.replace(/^form_fields\[(.*)\]$/, "$1");
        obj[cleanKey] = typeof val === "string" ? val.trim() : val;
      });
      return obj;
    } catch {
      // Fallback urlencoded text parsing
      try {
        const text = await request.text();
        const params = new URLSearchParams(text);
        const obj: Record<string, any> = {};
        params.forEach((val, key) => {
          const cleanKey = key.replace(/^form_fields\[(.*)\]$/, "$1");
          obj[cleanKey] = val.trim();
        });
        return obj;
      } catch {
        return {};
      }
    }
  }

  // Generic fallback
  try {
    const text = await request.text();
    return JSON.parse(text);
  } catch {
    return {};
  }
}

const MAX_BODY_BYTES = 100_000;\n\nfunction tokenMatches(a: string, b: string) {\n  const aa = Buffer.from(a);\n  const bb = Buffer.from(b);\n  return aa.length === bb.length && require("crypto").timingSafeEqual(aa, bb);\n}\n\nexport async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return corsResponse(
        { success: false, error: "Missing webhook token in URL path" },
        400
      );
    }

    const rawData = await parsePayload(request);

    // Auto-map common form builder field variations
    // 1. Full Name
    const firstName = rawData.first_name || rawData.firstName || rawData.fname || "";
    const lastName = rawData.last_name || rawData.lastName || rawData.lname || "";
    const combinedName = [firstName, lastName].filter(Boolean).join(" ");
    const fullName =
      rawData.full_name ||
      rawData.fullName ||
      rawData.name ||
      rawData["your-name"] ||
      rawData.lead_name ||
      rawData.customer_name ||
      rawData.client_name ||
      combinedName ||
      "Website Inquiry";

    // 2. Phone
    const phone =
      rawData.phone ||
      rawData.phoneNumber ||
      rawData.phone_number ||
      rawData.mobile ||
      rawData.telephone ||
      rawData.tel ||
      rawData["your-phone"] ||
      rawData.whatsapp ||
      rawData.contact_number ||
      "";

    // 3. Email
    const email =
      rawData.email ||
      rawData.email_address ||
      rawData.emailAddress ||
      rawData["your-email"] ||
      rawData.mail ||
      "";

    // 4. Company
    const company =
      rawData.company ||
      rawData.company_name ||
      rawData.business ||
      rawData.organization ||
      "";

    // 5. Notes / Message
    const message =
      rawData.message ||
      rawData.notes ||
      rawData.comments ||
      rawData["your-message"] ||
      rawData.query ||
      rawData.description ||
      rawData.details ||
      "";

    // 6. Value
    const estimatedValue = Number(
      rawData.estimatedValue ||
      rawData.estimated_value ||
      rawData.budget ||
      rawData.value ||
      0
    );

    if (!phone && !email) {
      return corsResponse(
        {
          success: false,
          error: "At least a phone number or email address is required to capture a lead.",
          receivedFields: Object.keys(rawData),
        },
        422
      );
    }

    const supabase = createAdminClient();

    const { data: tokenOrgs, error: tokenError } = await supabase\n      .from("organizations")\n      .select("id, name, status, whatsapp_enabled, whatsapp_phone_number, whatsapp_api_key, whatsapp_api_url, whatsapp_provider")\n      .eq("webhook_token" as any, token)\n      .limit(1);\n    if (!tokenError && tokenOrgs?.length === 1) org = tokenOrgs[0];\n\n    if (!org) {
      try {
        const { data: tokenOrgs } = await supabase
          .from("organizations")
          .select("*")
          .eq("webhook_token" as any, token)
          .limit(1);
        if (tokenOrgs && tokenOrgs.length > 0) {
          org = tokenOrgs[0];
        }
      } catch {
        // column may not exist before migration 00008 is executed
      }
    }

    // 4. Fallback to org id if UUID
    if (!org && token.length === 36) {
      const { data: idOrgs } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", token)
        .limit(1);
      if (idOrgs && idOrgs.length > 0) {
        org = idOrgs[0];
      }
    }

    if (!org) {
      return corsResponse(
        {
          success: false,
          error: "Invalid webhook token or organization not found",
        },
        404
      );
    }

    // Insert lead into CRM
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        organization_id: org.id,
        full_name: fullName,
        phone: phone || "Not Provided",
        email: email || null,
        company: company || null,
        source: "WEBSITE_FORM",
        status: "NEW",
        estimated_value: isNaN(estimatedValue) ? 0 : estimatedValue,
        notes: message || null,
      })
      .select("id")
      .single();

    if (leadError || !lead) {
      console.error("Webhook lead insertion error:", leadError);
      return corsResponse(
        { success: false, error: "Failed to store lead in CRM", details: leadError?.message },
        500
      );
    }

    // Insert lead activity record
    try {
      await supabase.from("lead_activities").insert({
        organization_id: org.id,
        lead_id: lead.id,
        type: "NOTE",
        title: "Website Form Submitted",
        description: message
          ? `User message: "${message}"`
          : `Captured automatically from website form webhook.`,
      });
    } catch (actErr) {
      console.warn("Could not insert lead activity:", actErr);
    }

    // Create Notification in CRM for members
    try {
      await supabase.from("notifications").insert({
        organization_id: org.id,
        type: "NEW_LEAD",
        title: `🌐 New Website Form Lead: ${fullName}`,
        message: `Phone: ${phone || "N/A"} • Email: ${email || "N/A"}${message ? ` • Note: ${message.slice(0, 60)}` : ""}`,
        link_url: `/app/leads`,
        is_read: false,
      });
    } catch (notifErr) {
      console.warn("Could not create notification:", notifErr);
    }

    // Auto-alert client on WhatsApp if WhatsApp API is enabled
    const orgAny = org as any;
    if (orgAny.whatsapp_enabled && orgAny.whatsapp_phone_number && orgAny.whatsapp_api_key) {
      try {
        const clientNotifyNumber = orgAny.whatsapp_phone_number.replace(/[^0-9]/g, "");
        const alertMsg = `🚀 *New Website Form Lead Captured!*\n\n👤 *Name:* ${fullName}\n📞 *Phone:* ${phone || "N/A"}\n✉️ *Email:* ${email || "N/A"}\n🏢 *Company:* ${company || "N/A"}\n📝 *Note:* ${message || "N/A"}\n\n👉 View in CRM: /app/leads`;

        if (orgAny.whatsapp_provider === "WATI") {
          const endpoint = `${orgAny.whatsapp_api_url || "https://live-server.wati.io"}/api/v1/sendSessionMessage/${clientNotifyNumber}?messageText=${encodeURIComponent(alertMsg)}`;
          fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${orgAny.whatsapp_api_key}`,
              "Content-Type": "application/json",
            },
          }).catch((e) => console.error("WATI alert error:", e));
        } else if (orgAny.whatsapp_provider === "AISENSY") {
          fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiKey: orgAny.whatsapp_api_key,
              campaignName: "lead_alert",
              destination: clientNotifyNumber,
              userName: org.name || "Admin",
              templateParams: [fullName, phone || "N/A", message || "New Lead"],
            }),
          }).catch((e) => console.error("AiSensy alert error:", e));
        }
      } catch (waAlertErr) {
        console.warn("WhatsApp instant alert failed:", waAlertErr);
      }
    }

    return corsResponse(
      {
        success: true,
        message: "Lead recorded successfully",
        leadId: lead.id,
        organization: org.name,
      },
      201
    );
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return corsResponse(
      { success: false, error: err?.message || "Internal server error" },
      500
    );
  }
}
