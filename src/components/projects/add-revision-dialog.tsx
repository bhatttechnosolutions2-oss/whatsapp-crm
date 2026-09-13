"use client";

import React, { useActionState, useEffect } from "react";
import { createProjectRevision } from "@/lib/actions/projects";
import { FeedbackType } from "@/types/crm";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { X, AlertCircle } from "lucide-react";

interface AddRevisionDialogProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddRevisionDialog({
  projectId,
  isOpen,
  onClose,
}: AddRevisionDialogProps) {
  const [state, formAction] = useActionState(
    createProjectRevision.bind(null, projectId),
    null
  );

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Request Revision / Approval
            </h3>
            <p className="text-xs text-slate-500">
              Submit client design feedback, content changes, or page approvals
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
          <Input
            id="title"
            name="title"
            label="Feedback Subject *"
            placeholder="e.g. Header typography & hero button color"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="feedbackType"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Feedback Type
              </label>
              <select
                id="feedbackType"
                name="feedbackType"
                defaultValue="DESIGN_APPROVAL"
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
              >
                <option value="DESIGN_APPROVAL">Design Approval</option>
                <option value="CONTENT_CHANGE">Content Change</option>
                <option value="BUG_FIX">Bug / Layout Fix</option>
                <option value="FEATURE_REQUEST">Feature Request</option>
                <option value="GENERAL">General Feedback</option>
              </select>
            </div>

            <Input
              id="pageUrl"
              name="pageUrl"
              label="Page / Screen URL"
              placeholder="/pricing or /about"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Detailed Feedback & Revision Instructions *
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              required
              placeholder="Describe the exact changes or approval notes..."
              className="flex w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
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
            <SubmitButton loadingText="Submitting...">
              Submit Feedback
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
