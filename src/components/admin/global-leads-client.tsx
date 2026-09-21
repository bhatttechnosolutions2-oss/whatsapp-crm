"use client";

import { useState } from "react";
import { Network, Search, Filter } from "lucide-react";

export function GlobalLeadsClient({ initialLeads }: { initialLeads: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeads = initialLeads.filter((lead) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      lead.full_name?.toLowerCase().includes(q) ||
      lead.phone?.toLowerCase().includes(q) ||
      lead.email?.toLowerCase().includes(q) ||
      lead.organizations?.name?.toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Network className="h-6 w-6 text-violet-600" />
            Global Leads
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View all leads across all client organizations.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by name, email, phone, or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="px-6 py-4">Lead Info</th>
                <th className="px-6 py-4">Organization</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{lead.full_name}</p>
                    <p className="text-xs text-slate-500">{lead.email || lead.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-violet-100 text-violet-800">
                      {lead.organizations?.name || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2 py-1 rounded-full border border-slate-200 bg-slate-50">
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    ₹{lead.estimated_value?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {formatDate(lead.created_at)}
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No leads found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
