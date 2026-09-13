import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // Webhook verification challenge (Meta / Wati / Custom standard)
  const { searchParams } = new URL(request.url);
  const hubMode = searchParams.get("hub.mode");
  const hubChallenge = searchParams.get("hub.challenge");
  const hubVerifyToken = searchParams.get("hub.verify_token");

  if (hubMode === "subscribe" && hubChallenge) {
    return new NextResponse(hubChallenge, { status: 200 });
  }

  return NextResponse.json({
    success: true,
    message: "WhatsApp Webhook Receiver is online",
    supportedProviders: ["WATI", "AISENSY", "TWILIO", "INTERAKT", "CUSTOM"],
  });
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgParam = searchParams.get("org") || searchParams.get("token") || searchParams.get("orgSlug");

    const payload = await request.json().catch(() => ({}));
    const supabase = createAdminClient();

    // 1. Identify organization
    let org: any = null;

    if (orgParam) {
      const { data: orgs } = await supabase
        .from("organizations")
        .select("*")
        .or(`webhook_token.eq.${orgParam},slug.eq.${orgParam}`)
        .limit(1);
      if (orgs && orgs.length > 0) org = orgs[0];
    }

    // Fallback: match by destination / receiver phone number in payload
    if (!org) {
      const recipientPhone =
        payload.to ||
        payload.destination ||
        payload.receiver ||
        payload.businessPhoneNumber;

      if (recipientPhone) {
        const cleanRecipient = String(recipientPhone).replace(/[^0-9]/g, "");
        const { data: orgs } = await supabase
          .from("organizations")
          .select("*")
          .ilike("whatsapp_phone_number", `%${cleanRecipient.slice(-10)}%`)
          .limit(1);
        if (orgs && orgs.length > 0) org = orgs[0];
      }
    }

    // Default to the first active org if still not found
    if (!org) {
      const { data: orgs } = await supabase
        .from("organizations")
        .select("*")
        .eq("status", "ACTIVE")
        .limit(1);
      if (orgs && orgs.length > 0) org = orgs[0];
    }

    if (!org) {
      return NextResponse.json(
        { success: false, error: "Target organization not identified" },
        { status: 404 }
      );
    }

    // 2. Parse incoming message details from various provider formats
    // Wati format: { waId: "919876543210", text: "Hello", senderName: "Rahul", id: "..." }
    // AiSensy format: { from: "919876543210", message: { text: "Hello" }, contact: { name: "Rahul" } }
    // Twilio format: { From: "whatsapp:+919876543210", Body: "Hello", ProfileName: "Rahul" }
    // Generic format: { phone, message, name }

    let senderPhone =
      payload.waId ||
      payload.from ||
      payload.From ||
      payload.sender ||
      payload.phone ||
      payload.contact?.phone ||
      "";

    let messageText =
      payload.text ||
      payload.message?.text ||
      payload.message ||
      payload.Body ||
      payload.body ||
      payload.buttonReply?.text ||
      payload.interactive?.button_reply?.title ||
      "";

    let senderName =
      payload.senderName ||
      payload.contact?.name ||
      payload.ProfileName ||
      payload.name ||
      "WhatsApp Contact";

    if (typeof messageText !== "string") {
      messageText = JSON.stringify(messageText);
    }

    let cleanPhone = String(senderPhone).replace(/[^0-9+]/g, "");
    if (cleanPhone.startsWith("whatsapp:")) {
      cleanPhone = cleanPhone.replace("whatsapp:", "");
    }
    if (!cleanPhone.startsWith("+") && cleanPhone.length === 10) {
      cleanPhone = `+91${cleanPhone}`;
    }

    if (!cleanPhone || !messageText) {
      return NextResponse.json(
        {
          success: true,
          message: "Ignored status ping or empty message",
        },
        { status: 200 }
      );
    }

    // 3. Find existing lead or auto-create new lead
    let leadId: string | null = null;
    const phoneLast10 = cleanPhone.replace(/[^0-9]/g, "").slice(-10);

    const { data: existingLeads } = await supabase
      .from("leads")
      .select("id, full_name")
      .eq("organization_id", org.id)
      .ilike("phone", `%${phoneLast10}%`)
      .limit(1);

    if (existingLeads && existingLeads.length > 0) {
      leadId = existingLeads[0].id;
      // Record message activity on existing lead
      await supabase.from("lead_activities").insert({
        organization_id: org.id,
        lead_id: leadId,
        type: "WHATSAPP_MESSAGE",
        title: `WhatsApp from ${existingLeads[0].full_name}`,
        description: messageText,
      });
    } else {
      // Auto-create new lead from incoming WhatsApp
      const { data: newLead } = await supabase
        .from("leads")
        .insert({
          organization_id: org.id,
          full_name: senderName,
          phone: cleanPhone,
          source: "WHATSAPP",
          status: "NEW",
          estimated_value: 0,
          notes: `First WhatsApp message: "${messageText}"`,
        })
        .select("id")
        .single();

      if (newLead) {
        leadId = newLead.id;
        await supabase.from("lead_activities").insert({
          organization_id: org.id,
          lead_id: leadId,
          type: "WHATSAPP_MESSAGE",
          title: "New WhatsApp Conversation Initiated",
          description: messageText,
        });
      }
    }

    // 4. Log message into whatsapp_messages table
    try {
      await supabase.from("whatsapp_messages").insert({
        organization_id: org.id,
        lead_id: leadId,
        direction: "INBOUND",
        from_number: cleanPhone,
        to_number: org.whatsapp_phone_number || "Business",
        message: messageText,
        status: "RECEIVED",
        provider: org.whatsapp_provider || "WEBHOOK",
        provider_message_id: payload.id || payload.messageId || null,
      } as any);
    } catch {
      // table pending migration
    }

    // 5. Notify CRM members
    try {
      await supabase.from("notifications").insert({
        organization_id: org.id,
        type: "NEW_LEAD",
        title: `💬 WhatsApp from ${senderName}`,
        message: `"${messageText.slice(0, 80)}" • Phone: ${cleanPhone}`,
        link_url: leadId ? `/app/leads?view=all` : "/app/whatsapp",
        is_read: false,
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp message processed successfully",
      leadId,
      organization: org.name,
    });
  } catch (err: any) {
    console.error("WhatsApp webhook error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
