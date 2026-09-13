"use client";

import React, { useActionState, useEffect } from "react";
import { createProject } from "@/lib/actions/projects";
import { ClientWithProjects, ProjectType, ProjectStatus } from "@/types/crm";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { X, AlertCircle } from "lucide-react";

interface AddProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientWithProjects[];
}

export function AddProjectDialog({
  isOpen,
  onClose,
  clients,
}: AddProjectDialogProps) {
  const [state, formAction] = useActionState(createProject, null);

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl transition-all my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Create Website Project
            </h3>
            <p className="text-xs text-slate-500">
              Set up a website deliverable, milestones, and design portal
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
            <div>
              <label
                htmlFor="clientId"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Client Account *
              </label>
              <select
                id="clientId"
                name="clientId"
                required
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
              >
                <option value="">Select a Client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} {c.company_name ? `(${c.company_name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <Input
              id="name"
              name="name"
              label="Project Title *"
              placeholder="e.g. Modern E-commerce Redesign"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="projectType"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Project Type
              </label>
              <select
                id="projectType"
                name="projectType"
                defaultValue="WEBSITE_DESIGN"
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
              >
                <option value="WEBSITE_DESIGN">Website Design</option>
                <option value="ECOMMERCE">E-commerce Store</option>
                <option value="LANDING_PAGE">Landing Page</option>
                <option value="WEB_APP">Web Application</option>
                <option value="SEO_MARKETING">SEO & Marketing</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Current Phase
              </label>
              <select
                id="status"
                name="status"
                defaultValue="PLANNING"
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
              >
                <option value="PLANNING">Planning / Discovery</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Client Review</option>
                <option value="APPROVED">Design Approved</option>
                <option value="COMPLETED">Completed / Live</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>

            <Input
              id="budget"
              name="budget"
              type="number"
              label="Project Budget (₹)"
              placeholder="50000"
              min="0"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="previewUrl"
              name="previewUrl"
              label="Preview / Staging URL"
              placeholder="https://staging.example.com"
            />
            <Input
              id="figmaUrl"
              name="figmaUrl"
              label="Figma Design URL"
              placeholder="https://figma.com/file/..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="productionUrl"
              name="productionUrl"
              label="Final Production URL"
              placeholder="https://clientbrand.com"
            />
            <Input
              id="targetLaunchDate"
              name="targetLaunchDate"
              type="date"
              label="Target Launch Date"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Project Scope & Deliverable Notes
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Key pages, tech stack, or deliverables required..."
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
            <SubmitButton loadingText="Creating project...">
              Launch Project
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
