"use client";

import { useState } from "react";
import { MessageCircle, Search, CheckCircle2, XCircle } from "lucide-react";

export function GlobalWhatsAppClient({ initialMessages }: { initialMessages: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMessages = initialMessages.filter((msg) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      msg.to_number?.toLowerCase().includes(q) ||
      msg.message?.toLowerCase().includes(q) ||
      msg.organizations?.name?.toLowerCase().includes(q)
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
            <MessageCircle className="h-6 w-6 text-emerald-600" />
            Global WhatsApp Tracking
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor WhatsApp message delivery and performance across all clients.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search messages by recipient number, content, or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:emerald-500 focus:bg-white transition"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="px-6 py-4">Organization</th>
                <th className="px-6 py-4">Direction</th>
                <th className="px-6 py-4">To Number</th>
                <th className="px-6 py-4">Message Snippet</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMessages.map((msg) => (
                <tr key={msg.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
                      {msg.organizations?.name || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded border ${
                      msg.direction === "OUTBOUND" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"
                    }`}>
                      {msg.direction}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-700">
                    {msg.to_number}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600 line-clamp-1 max-w-xs" title={msg.message}>
                      {msg.message}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {msg.status === "SENT" || msg.status === "DELIVERED" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        {msg.status}
                      </span>
                    ) : msg.status === "FAILED" ? (
                      <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                        <XCircle className="h-4 w-4" />
                        FAILED
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">{msg.status}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {formatDate(msg.created_at)}
                  </td>
                </tr>
              ))}
              {filteredMessages.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No WhatsApp messages found matching your criteria.
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
