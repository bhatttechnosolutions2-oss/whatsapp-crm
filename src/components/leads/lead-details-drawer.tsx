"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lead, LeadActivity, LeadStatus } from "@/types/crm";
import { updateLeadStatus, addLeadActivity, deleteLead, getLeadActivities } from "@/lib/actions/leads";
import { convertLeadToClient } from "@/lib/actions/clients";
import { sendWhatsAppMessage } from "@/lib/actions/integrations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import {
  X,
  Phone,
  MessageSquare,
  Mail,
  Building,
  Calendar,
  Clock,
  Send,
  Trash2,
  CheckCircle,
  FileText,
  User,
  Plus,
  UserCheck,
} from "lucide-react";

interface LeadDetailsDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (leadId: string, newStatus: LeadStatus) => void;
}

export function LeadDetailsDrawer({
  lead,
  isOpen,
  onClose,
  onStatusChange,
}: LeadDetailsDrawerProps) {
  const router = useRouter();
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [activityType, setActivityType] = useState<LeadActivity["type"]>("NOTE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (lead?.id && isOpen) {
      setLoadingActivities(true);
      getLeadActivities(lead.id)
        .then((data) => setActivities(data))
        .finally(() => setLoadingActivities(false));
    }
  }, [lead?.id, isOpen]);

  if (!isOpen || !lead) return null;

  // Format clean phone for WhatsApp wa.me link
  const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
  const waLink = `https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(lead.full_name)},%20thank%20you%20for%20connecting%20with%20us.`;

  const handleStatusUpdate = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as LeadStatus;
    if (newStatus !== lead.status) {
      await updateLeadStatus(lead.id, newStatus);
      if (onStatusChange) onStatusChange(lead.id, newStatus);
      const updated = await getLeadActivities(lead.id);
      setActivities(updated);
    }
  };

  const handleConvertToClient = async () => {
    if (confirm(`Convert ${lead.full_name} to an active client?`)) {
      setIsConverting(true);
      const result = await convertLeadToClient(lead.id);
      setIsConverting(false);
      if (result.success) {
        onClose();
        router.push("/app/clients");
      }
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("type", activityType);
    if (activityType === "WHATSAPP_MESSAGE") {
      formData.append("title", "WhatsApp Message Sent");
      // Also dispatch via connected WhatsApp API (Wati/AiSensy/etc)
      await sendWhatsAppMessage({
        leadId: lead.id,
        phone: lead.phone,
        message: newNote,
      });
    } else {
      formData.append("title", activityType === "CALL" ? "Phone Call Logged" : "Note Added");
      await addLeadActivity(lead.id, null, formData);
    }

    setNewNote("");
    const updated = await getLeadActivities(lead.id);
    setActivities(updated);
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this lead?")) {
      await deleteLead(lead.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {lead.full_name}
                </h2>
                <Badge variant="outline" className="text-[11px] font-semibold">
                  {lead.source.replace("_", " ")}
                </Badge>
              </div>
              {lead.company && (
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  {lead.company}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Delete Lead"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick Action Bar (WhatsApp + Call + Convert) */}
          <div className="grid grid-cols-3 gap-2.5 p-4 bg-white border-b border-slate-100">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              WhatsApp
            </a>
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-blue-600" />
              Call
            </a>
            <button
              onClick={handleConvertToClient}
              disabled={isConverting}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <UserCheck className="h-3.5 w-3.5" />
              To Client
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status Selector & Value */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Pipeline Stage
                </label>
                <select
                  defaultValue={lead.status}
                  onChange={handleStatusUpdate}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-xs focus:border-blue-600 focus:outline-none"
                >
                  <option value="NEW">New Lead</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="PROPOSAL_SENT">Proposal Sent</option>
                  <option value="WON">Won (Converted)</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Estimated Value
                </span>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  ₹{formatNumber(lead.estimated_value || 0)}
                </p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contact Information
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="font-mono">{lead.phone}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-2.5 text-slate-700">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{lead.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-500">
                    Created on {new Date(lead.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {lead.notes && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Initial Notes
                </h4>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {lead.notes}
                </div>
              </div>
            )}

            {/* Log Activity & Notes Form */}
            <div className="space-y-3 border-t border-slate-100 pt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Log Activity / Add Note
              </h4>
              <form onSubmit={handleAddActivity} className="space-y-3">
                <div className="flex gap-2">
                  {(["NOTE", "CALL", "WHATSAPP_MESSAGE", "FOLLOW_UP"] as const).map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setActivityType(type)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          activityType === type
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {type === "NOTE"
                          ? "Note"
                          : type === "CALL"
                          ? "Call"
                          : type === "WHATSAPP_MESSAGE"
                          ? "WhatsApp"
                          : "Follow-up"}
                      </button>
                    )
                  )}
                </div>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record customer discussion, next action, or meeting notes..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || !newNote.trim()}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Log Activity
                  </Button>
                </div>
              </form>
            </div>

            {/* Activity History Timeline */}
            <div className="space-y-3 border-t border-slate-100 pt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Activity Timeline
              </h4>

              {loadingActivities ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Loading activity timeline...
                </div>
              ) : activities.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No activity history logged yet
                </div>
              ) : (
                <div className="space-y-4 pl-2">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="relative pl-6 pb-4 border-l border-slate-200 last:border-l-0"
                    >
                      <div className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-white" />
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          {act.title}
                        </p>
                        {act.description && (
                          <p className="mt-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                            {act.description}
                          </p>
                        )}
                        <span className="mt-1 block text-[10px] text-slate-400">
                          {new Date(act.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
