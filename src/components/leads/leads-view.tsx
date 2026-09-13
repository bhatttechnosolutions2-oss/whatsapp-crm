"use client";

import React, { useState, useMemo } from "react";
import { Lead, LeadSource, LeadStatus } from "@/types/crm";
import { LeadTable } from "./lead-table";
import { LeadKanban } from "./lead-kanban";
import { LeadDetailsDrawer } from "./lead-details-drawer";
import { AddLeadDialog } from "./add-lead-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  LayoutList,
  Kanban,
  Search,
  Plus,
  Users,
  Filter,
  MessageSquare,
  Globe,
  UserPlus,
} from "lucide-react";

interface LeadsViewProps {
  initialLeads: Lead[];
  defaultSourceFilter?: LeadSource;
  headerTitle?: string;
  headerDescription?: string;
}

export function LeadsView({
  initialLeads,
  defaultSourceFilter,
  headerTitle = "Leads Management",
  headerDescription = "Track, assign, and convert incoming leads across channels",
}: LeadsViewProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>(
    defaultSourceFilter || "ALL"
  );
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Sync state if initialLeads update
  React.useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  // Filter leads by search query and source
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSource =
        sourceFilter === "ALL" || lead.source === sourceFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        lead.full_name.toLowerCase().includes(query) ||
        (lead.company && lead.company.toLowerCase().includes(query)) ||
        lead.phone.includes(query) ||
        (lead.email && lead.email.toLowerCase().includes(query));

      return matchesSource && matchesSearch;
    });
  }, [leads, sourceFilter, searchQuery]);

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {headerTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{headerDescription}</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Table View"
            >
              <LayoutList className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Pipeline View"
            >
              <Kanban className="h-4 w-4" />
              <span className="hidden sm:inline">Pipeline</span>
            </button>
          </div>

          <Button
            onClick={() => setIsAddDialogOpen(true)}
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Source Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Leads" },
            { id: "WHATSAPP", label: "WhatsApp" },
            { id: "WEBSITE_FORM", label: "Website Form" },
            { id: "MANUAL", label: "Manual" },
            { id: "GOOGLE_ADS", label: "Google Ads" },
            { id: "META_ADS", label: "Meta Ads" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSourceFilter(tab.id)}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                sourceFilter === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by name, phone..."
            className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Content (Table or Kanban or EmptyState) */}
      {filteredLeads.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <EmptyState
            icon={<Users className="h-8 w-8 text-slate-400" />}
            title={
              searchQuery || sourceFilter !== "ALL"
                ? "No leads match your filter"
                : "No leads yet"
            }
            description={
              searchQuery || sourceFilter !== "ALL"
                ? "Try adjusting your search criteria or filter tags."
                : "Your customer inquiries and website submissions will be organized here."
            }
            action={
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                size="sm"
                className="flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Lead
              </Button>
            }
          />
        </div>
      ) : viewMode === "table" ? (
        <LeadTable
          leads={filteredLeads}
          onSelectLead={(lead) => setSelectedLead(lead)}
        />
      ) : (
        <LeadKanban
          leads={filteredLeads}
          onSelectLead={(lead) => setSelectedLead(lead)}
        />
      )}

      {/* Lead Details Slide-over Drawer */}
      <LeadDetailsDrawer
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onStatusChange={handleStatusChange}
      />

      {/* Add Lead Modal */}
      <AddLeadDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        defaultSource={
          sourceFilter !== "ALL" ? (sourceFilter as LeadSource) : "MANUAL"
        }
      />
    </div>
  );
}
