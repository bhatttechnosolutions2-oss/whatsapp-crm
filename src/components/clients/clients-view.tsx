"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClientWithProjects } from "@/types/crm";
import { AddClientDialog } from "./add-client-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  UserCheck,
  Plus,
  Search,
  Building,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Briefcase,
  FolderPlus,
} from "lucide-react";

interface ClientsViewProps {
  initialClients: ClientWithProjects[];
}

export function ClientsView({ initialClients }: ClientsViewProps) {
  const [clients, setClients] = useState<ClientWithProjects[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  React.useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      client.full_name.toLowerCase().includes(query) ||
      (client.company_name && client.company_name.toLowerCase().includes(query)) ||
      client.phone.includes(query) ||
      (client.email && client.email.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Client Directory
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage active client accounts, websites, and deliverable projects
          </p>
        </div>

        <Button
          onClick={() => setIsAddDialogOpen(true)}
          size="sm"
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by client name, company..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
        />
      </div>

      {/* Clients Cards Grid */}
      {filteredClients.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <EmptyState
            icon={<UserCheck className="h-8 w-8 text-slate-400" />}
            title={searchQuery ? "No clients match your search" : "No clients yet"}
            description={
              searchQuery
                ? "Try searching with a different term."
                : "Add your first client or convert a won lead from your leads pipeline."
            }
            action={
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                size="sm"
                className="flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Client
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
            const cleanPhone = client.phone.replace(/[^0-9]/g, "");
            const waLink = `https://wa.me/${cleanPhone}`;

            return (
              <div
                key={client.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">
                        {client.full_name}
                      </h3>
                      {client.company_name && (
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Building className="h-3.5 w-3.5 text-slate-400" />
                          {client.company_name}
                        </p>
                      )}
                    </div>
                    <Badge variant="success" className="text-[10px]">
                      {client.status}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{client.phone}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{client.email}</span>
                      </div>
                    )}
                    {client.website_url && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <a
                          href={client.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          {client.website_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                    <span>{client.projectCount || 0} Projects</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </a>
                    <a
                      href={`tel:${client.phone}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                      title="Call"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Client Dialog */}
      <AddClientDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
    </div>
  );
}
