import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { LeadSource } from "@/types/database";
import { z } from "zod";

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

// Strict Zod schema for public lead ingestion
const publicLeadIngestSchema = z.object({
  tokenOrSlug: z.string().trim().min(1, "Organization token or slug is required").max(100),
  fullName: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().max(30).optional().default(""),
  email: z.string().trim().max(100).optional().default(""),
  company: z.string().trim().max(100).optional().default(""),
  message: z.string().trim().max(2000).optional().default(""),
  estimatedValue: z.number().nonnegative().max(100000000).optional().default(0),
  source: z.string().trim().max(50).optional().default("WEBSITE_FORM"),
});

export async function POST(request: NextRequest) {
  try {
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous-ip";

    // 1. IP-based Rate Limiting (max 15 submissions per minute per IP)
    const rateLimit = checkRateLimit(`ingest:${ipAddress}`, 15, 60 * 1000);
    if (!rateLimit.success) {
      return corsResponse(
        { success: false, error: "Rate limit exceeded. Please try again later." },
        429
      );
    }

    // 2. Payload size limits (max 64KB)
    const rawBody = await request.text();
    if (!rawBody) {
      return corsResponse({ success: false, error: "Empty request body" }, 400);
    }
    if (rawBody.length > 65536) {
      return corsResponse({ success: false, error: "Payload too large (max 64KB)" }, 413);
    }

    const contentType = request.headers.get("content-type") || "";
    let parsedBody: Record<string, any> = {};

    if (contentType.includes("application/json")) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        return corsResponse({ success: false, error: "Malformed JSON payload" }, 400);
      }
    } else {
      // Parse URL-encoded or form data
      const params = new URLSearchParams(rawBody);
      params.forEach((val, key) => {
        const cleanKey = key.replace(/^form_fields\[(.*)\]$/, "$1");
        parsedBody[cleanKey] = val.trim();
      });
    }

    // 3. Honeypot field detection (reject automated bot submissions)
    const honeypot =
      parsedBody._hp ||
      parsedBody.website ||
      parsedBody.honeypot ||
      parsedBody.bot_check ||
      parsedBody["url_check"];

    if (honeypot && String(honeypot).trim().length > 0) {
      return corsResponse(
        { success: false, error: "Spam submission rejected" },
        400
      );
    }

    // Extract identifier
    const tokenOrSlug =
      parsedBody.webhook_token ||
      parsedBody.token ||
      parsedBody.orgSlug ||
      parsedBody.org_slug ||
      parsedBody.organization_id;

    if (!tokenOrSlug || typeof tokenOrSlug !== "string") {
      return corsResponse(
        { success: false, error: "Missing required 'webhook_token' or 'orgSlug' identifier" },
        400
      );
    }

    // Auto-map common form inputs
    const fullName =
      parsedBody.fullName ||
      parsedBody.full_name ||
      parsedBody.name ||
      parsedBody["your-name"] ||
      [parsedBody.firstName || parsedBody.first_name, parsedBody.lastName || parsedBody.last_name]
        .filter(Boolean)
        .join(" ") ||
      "";

    const phone =
      parsedBody.phone ||
      parsedBody.phoneNumber ||
      parsedBody.phone_number ||
      parsedBody.mobile ||
      parsedBody.tel ||
      parsedBody["your-phone"] ||
      parsedBody.whatsapp ||
      "";

    const email =
      parsedBody.email ||
      parsedBody.emailAddress ||
      parsedBody.email_address ||
      parsedBody["your-email"] ||
      "";

    const company = parsedBody.company || parsedBody.company_name || parsedBody.business || "";
    const message = parsedBody.notes || parsedBody.message || parsedBody.comments || parsedBody["your-message"] || "";
    const rawEstimatedValue = Number(parsedBody.estimatedValue || parsedBody.estimated_value || parsedBody.budget || 0);

    // 4. Validate through Zod schema
    const validationResult = publicLeadIngestSchema.safeParse({
      tokenOrSlug: String(tokenOrSlug).trim(),
      fullName: String(fullName).trim() || "Website Inquiry",
      phone: String(phone).trim(),
      email: String(email).trim(),
      company: String(company).trim(),
      message: String(message).trim(),
      estimatedValue: isNaN(rawEstimatedValue) ? 0 : Math.max(0, rawEstimatedValue),
      source: String(parsedBody.source || "WEBSITE_FORM").trim(),
    });

    if (!validationResult.success) {
      return corsResponse(
        { success: false, error: validationResult.error.errors[0]?.message || "Invalid input data" },
        422
      );
    }

    const validData = validationResult.data;

    // 5. Contact validation: At least one valid contact method required
    const cleanPhone = validData.phone.replace(/[^0-9+() -]/g, "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = validData.email ? emailRegex.test(validData.email) : false;
    const isValidPhone = cleanPhone.replace(/[^0-9]/g, "").length >= 7;

    if (!isValidEmail && !isValidPhone) {
      return corsResponse(
        {
          success: false,
          error: "A valid phone number (at least 7 digits) or valid email address is required",
        },
        422
      );
    }

    // 6. Safe server-side organization identification & status check
    const supabase = createAdminClient();

    // Public ingestion is authenticated only by a high-entropy webhook token.
    if (typeof tokenOrSlug !== "string" || tokenOrSlug.length < 24 || tokenOrSlug.length > 200) {
      return corsResponse({ success: false, error: "Valid webhook token required" }, 401);
    }

    const { data: orgs, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, status")
      .eq("webhook_token" as any, tokenOrSlug)
      .eq("status", "ACTIVE")
      .limit(1);

    const org = orgs?.[0] || null;
    if (orgError || !org) {
      return corsResponse({ success: false, error: "Invalid or inactive organization identifier" }, 401);
    }

    // 7. Sanitize and safely persist ONLY explicit columns (prevent arbitrary field injection)
    const sanitizedNotes = validData.message
      ? validData.message.replace(/<[^>]*>/g, "").slice(0, 2000)
      : null;

    const allowedSources: Record<string, LeadSource> = {
      WHATSAPP: "WHATSAPP",
      WEBSITE_FORM: "WEBSITE_FORM",
      MANUAL: "MANUAL",
      GOOGLE_ADS: "GOOGLE_ADS",
      META_ADS: "META_ADS",
      REFERRAL: "REFERRAL",
      OTHER: "OTHER",
    };
    const leadSource: LeadSource = allowedSources[validData.source.toUpperCase()] || "WEBSITE_FORM";

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        organization_id: org.id,
        full_name: validData.fullName.replace(/<[^>]*>/g, "").slice(0, 120),
        phone: isValidPhone ? cleanPhone : "Not Provided",
        email: isValidEmail ? validData.email.toLowerCase() : null,
        company: validData.company ? validData.company.replace(/<[^>]*>/g, "").slice(0, 100) : null,
        source: leadSource,
        status: "NEW",
        estimated_value: validData.estimatedValue,
        notes: sanitizedNotes,
      })
      .select("id")
      .single();

    if (leadError || !lead) {
      // Clean error without exposing database internals
      return corsResponse(
        { success: false, error: "Failed to record lead entry" },
        500
      );
    }

    // 8. Record audit activity
    try {
      await supabase.from("lead_activities").insert({
        organization_id: org.id,
        lead_id: lead.id,
        type: "NOTE",
        title: `Captured via ${validData.source}`,
        description: sanitizedNotes || "Lead automatically captured via Web API",
      });
    } catch {
      // Non-blocking
    }

    // 9. Dispatch in-app notification
    try {
      await supabase.from("notifications").insert({
        organization_id: org.id,
        type: "NEW_LEAD",
        title: `🌐 New Form Lead: ${validData.fullName}`,
        message: `Phone: ${isValidPhone ? cleanPhone : "N/A"} • Email: ${isValidEmail ? validData.email : "N/A"}`,
        link_url: `/app/leads`,
        is_read: false,
      });
    } catch {
      // Non-blocking
    }

    return corsResponse(
      {
        success: true,
        message: "Lead successfully recorded",
        leadId: lead.id,
      },
      201
    );
  } catch {
    return corsResponse(
      {
        success: false,
        error: "Internal server error",
      },
      500
    );
  }
}
