"use client";

import React from "react";
import { Lead, LeadStatus } from "@/types/crm";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { Phone, MessageSquare, Building } from "lucide-react";

interface LeadKanbanProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

const COLUMNS: { id: LeadStatus; title: string; color: string }[] = [
  { id: "NEW", title: "New", color: "bg-blue-500" },
  { id: "CONTACTED", title: "Contacted", color: "bg-amber-500" },
  { id: "QUALIFIED", title: "Qualified", color: "bg-purple-500" },
  { id: "PROPOSAL_SENT", title: "Proposal", color: "bg-indigo-500" },
  { id: "WON", title: "Won", color: "bg-emerald-500" },
  { id: "LOST", title: "Lost", color: "bg-slate-400" },
];

export function LeadKanban({ leads, onSelectLead }: LeadKanbanProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
      {COLUMNS.map((col) => {
        const columnLeads = leads.filter((lead) => lead.status === col.id);
        const columnValue = columnLeads.reduce(
          (sum, lead) => sum + (Number(lead.estimated_value) || 0),
          0
        );

        return (
          <div
            key={col.id}
            className="flex-shrink-0 w-72 flex flex-col rounded-2xl bg-slate-100/70 p-3.5 border border-slate-200/60"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 px-1">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {col.title}
                </h4>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-600 shadow-xs">
                  {columnLeads.length}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                ₹{formatNumber(columnValue)}
              </span>
            </div>

            {/* Leads Card List */}
            <div className="space-y-2.5 flex-1 min-h-[250px]">
              {columnLeads.length === 0 ? (
                <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No leads in {col.title.toLowerCase()}
                </div>
              ) : (
                columnLeads.map((lead) => {
                  const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
                  const waLink = `https://wa.me/${cleanPhone}`;

                  return (
                    <div
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                          {lead.full_name}
                        </span>
                        <Badge
                          variant={lead.source === "WHATSAPP" ? "success" : "secondary"}
                          className="text-[9px] px-1.5 py-0"
                        >
                          {lead.source}
                        </Badge>
                      </div>

                      {lead.company && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Building className="h-3 w-3 text-slate-400" />
                          {lead.company}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="font-bold text-slate-800">
                          ₹{formatNumber(lead.estimated_value || 0)}
                        </span>
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700"
                            title="WhatsApp"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </a>
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-slate-400 hover:text-slate-600"
                            title="Call"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
