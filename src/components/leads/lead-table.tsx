"use client";

import React from "react";
import { Lead, LeadStatus } from "@/types/crm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { Phone, MessageSquare, ChevronRight, Building } from "lucide-react";

interface LeadTableProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

const statusVariantMap: Record<LeadStatus, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  NEW: "default",
  CONTACTED: "warning",
  QUALIFIED: "secondary",
  PROPOSAL_SENT: "outline",
  WON: "success",
  LOST: "destructive",
};

export function LeadTable({ leads, onSelectLead }: LeadTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/75 text-xs uppercase tracking-wider text-slate-500 font-semibold">
          <tr>
            <th className="px-5 py-3.5">Lead Name</th>
            <th className="px-5 py-3.5">Contact</th>
            <th className="px-5 py-3.5">Source</th>
            <th className="px-5 py-3.5">Status</th>
            <th className="px-5 py-3.5 text-right">Est. Value</th>
            <th className="px-5 py-3.5 text-right">Created</th>
            <th className="px-4 py-3.5 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.map((lead) => {
            const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
            const waLink = `https://wa.me/${cleanPhone}`;

            return (
              <tr
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className="hover:bg-slate-50/75 cursor-pointer transition-colors group"
              >
                <td className="px-5 py-4">
                  <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {lead.full_name}
                  </div>
                  {lead.company && (
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Building className="h-3 w-3" />
                      {lead.company}
                    </div>
                  )}
                </td>

                <td className="px-5 py-4">
                  <div className="text-xs font-mono text-slate-700">
                    {lead.phone}
                  </div>
                  {lead.email && (
                    <div className="text-xs text-slate-400">{lead.email}</div>
                  )}
                </td>

                <td className="px-5 py-4">
                  <Badge
                    variant={lead.source === "WHATSAPP" ? "success" : "secondary"}
                    className="text-[11px] font-medium"
                  >
                    {lead.source.replace("_", " ")}
                  </Badge>
                </td>

                <td className="px-5 py-4">
                  <Badge
                    variant={statusVariantMap[lead.status]}
                    className="text-[11px] font-semibold"
                  >
                    {lead.status.replace("_", " ")}
                  </Badge>
                </td>

                <td className="px-5 py-4 text-right font-semibold text-slate-900">
                  ₹{formatNumber(lead.estimated_value || 0)}
                </td>

                <td className="px-5 py-4 text-right text-xs text-slate-400">
                  {new Date(lead.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </td>

                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="WhatsApp Chat"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => onSelectLead(lead)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
