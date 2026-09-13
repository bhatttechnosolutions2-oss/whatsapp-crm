import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/actions/integrations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: 'phone' and 'message'" },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessage({ leadId, phone, message });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
