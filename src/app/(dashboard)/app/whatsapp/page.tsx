import React from "react";
import { getLeadsData } from "@/lib/actions/leads";
import { LeadsView } from "@/components/leads/leads-view";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, QrCode, Webhook, Zap, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WhatsAppPage() {
  const whatsAppLeads = await getLeadsData("WHATSAPP");

  return (
    <div className="space-y-6">
      {/* WhatsApp Integration Info Banner */}
      <Card className="border-emerald-100 bg-gradient-to-r from-emerald-50/60 to-teal-50/40">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  WhatsApp Business Pipeline
                  <Badge variant="success" className="text-[10px]">Instant Connect</Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Manage incoming customer chats, instant follow-ups, and auto-captured WhatsApp leads
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>1-Click wa.me Chat Launch</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Leads view filtered to WhatsApp */}
      <LeadsView
        initialLeads={whatsAppLeads}
        defaultSourceFilter="WHATSAPP"
        headerTitle="WhatsApp Leads"
        headerDescription="Inbound WhatsApp chats, customer inquiries, and mobile conversions"
      />
    </div>
  );
}
