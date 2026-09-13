"use client";

import React, { useActionState, useEffect } from "react";
import { createClientRecord } from "@/lib/actions/clients";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { X, AlertCircle } from "lucide-react";

interface AddClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddClientDialog({ isOpen, onClose }: AddClientDialogProps) {
  const [state, formAction] = useActionState(createClientRecord, null);

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
            <h3 className="text-lg font-bold text-slate-900">Add New Client</h3>
            <p className="text-xs text-slate-500">
              Create an active client account and profile
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
              label="Client Contact Name *"
              placeholder="e.g. Priya Sharma"
              required
            />
            <Input
              id="phone"
              name="phone"
              label="Phone Number *"
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
              placeholder="client@business.com"
            />
            <Input
              id="companyName"
              name="companyName"
              label="Company / Brand Name"
              placeholder="Sharma Global Trading"
            />
          </div>

          <Input
            id="websiteUrl"
            name="websiteUrl"
            label="Current Website (if any)"
            placeholder="https://example.com"
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-slate-600"
            >
              Cancel
            </Button>
            <SubmitButton loadingText="Adding client...">
              Save Client
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
