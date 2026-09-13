"use client";

import React, { useActionState, useEffect } from "react";
import { createLead, LeadActionResult } from "@/lib/actions/leads";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { LeadSource, LeadStatus } from "@/types/crm";
import { X, AlertCircle } from "lucide-react";

interface AddLeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSource?: LeadSource;
}

export function AddLeadDialog({
  isOpen,
  onClose,
  defaultSource = "MANUAL",
}: AddLeadDialogProps) {
  const [state, formAction] = useActionState(createLead, null);

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl transition-all my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Add New Lead</h3>
            <p className="text-xs text-slate-500">
              Register a business inquiry or manual contact
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {state?.error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="fullName"
              name="fullName"
              label="Contact Full Name *"
              placeholder="e.g. Ramesh Sharma"
              required
            />
            <Input
              id="phone"
              name="phone"
              label="Phone / WhatsApp Number *"
              placeholder="e.g. +91 9876543210"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email Address"
              placeholder="name@company.com"
            />
            <Input
              id="company"
              name="company"
              label="Company / Business Name"
              placeholder="Acme Enterprises"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="source"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Lead Source
              </label>
              <select
                id="source"
                name="source"
                defaultValue={defaultSource}
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="MANUAL">Manual Entry</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="WEBSITE_FORM">Website Form</option>
                <option value="GOOGLE_ADS">Google Ads</option>
                <option value="META_ADS">Meta Ads</option>
                <option value="REFERRAL">Referral</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Initial Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue="NEW"
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="NEW">New Lead</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>

            <Input
              id="estimatedValue"
              name="estimatedValue"
              type="number"
              label="Est. Value (₹)"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Notes / Requirements
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Specific customer requirements or inquiry details..."
              className="flex w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-slate-600"
            >
              Cancel
            </Button>
            <SubmitButton loadingText="Creating lead...">
              Save Lead
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
