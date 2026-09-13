"use client";

import React, { useState, useTransition } from "react";
import { ClientPortalData, ProjectWithDetails, InvoiceWithDetails } from "@/types/crm";
import { submitClientRevision, portalSignOut } from "@/lib/actions/portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  Globe,
  ExternalLink,
  Figma,
  Plus,
  RefreshCw,
  Receipt,
  Printer,
  LogOut,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  X,
  MessageSquare,
} from "lucide-react";

interface ClientPortalViewProps {
  portalData: ClientPortalData;
}

export function ClientPortalView({ portalData }: ClientPortalViewProps) {
  const { client, projects, invoices } = portalData;
  const [activeTab, setActiveTab] = useState<"PROJECTS" | "INVOICES">("PROJECTS");
  const [selectedProject, setSelectedProject] = useState<ProjectWithDetails | null>(
    projects.length > 0 ? projects[0] : null
  );
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [revisionError, setRevisionError] = useState<string | null>(null);
  const [revisionSuccess, setRevisionSuccess] = useState<string | null>(null);

  const [revisionTitle, setRevisionTitle] = useState("");
  const [revisionDesc, setRevisionDesc] = useState("");
  const [revisionUrl, setRevisionUrl] = useState("");
  const [feedbackType, setFeedbackType] = useState("CONTENT_CHANGE");

  const handleRevisionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProject) return;

    setRevisionError(null);
    setRevisionSuccess(null);

    const formData = new FormData();
    formData.append("projectId", selectedProject.id);
    formData.append("title", revisionTitle);
    formData.append("description", revisionDesc);
    formData.append("pageUrl", revisionUrl);
    formData.append("feedbackType", feedbackType);

    startTransition(async () => {
      const res = await submitClientRevision(formData);
      if (!res.success) {
        setRevisionError(res.error || "Failed to submit revision");
      } else {
        setRevisionSuccess("Your feedback has been sent to the design team!");
        setRevisionTitle("");
        setRevisionDesc("");
        setRevisionUrl("");
        setTimeout(() => {
          setIsRevisionOpen(false);
          setRevisionSuccess(null);
        }, 2000);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "APPROVED":
      case "PAID":
        return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">{status}</Badge>;
      case "IN_PROGRESS":
      case "SENT":
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">{status.replace("_", " ")}</Badge>;
      case "REVIEW":
        return <Badge className="bg-purple-500/10 text-purple-700 border-purple-200">In Review</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Client Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 font-bold text-white shadow-sm">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 block leading-tight">
                Client Workspace
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Welcome, {client.full_name} {client.company_name ? `(${client.company_name})` : ""}
              </span>
            </div>
          </div>

          <form action={portalSignOut}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Sign Out
            </Button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab("PROJECTS")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "PROJECTS"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            My Website Projects ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab("INVOICES")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "INVOICES"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Invoices & Billing ({invoices.length})
          </button>
        </div>

        {/* Tab 1: Projects */}
        {activeTab === "PROJECTS" && (
          <div className="space-y-6">
            {projects.length === 0 ? (
              <Card className="p-12 text-center rounded-3xl bg-white border-slate-100 shadow-sm">
                <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No active projects yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Your website design project will appear here once initial kickoff planning begins.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Selector List */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Your Projects
                  </span>
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProject(p)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedProject?.id === p.id
                          ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-500/10"
                          : "bg-white/80 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{p.name}</h4>
                        {getStatusBadge(p.status)}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{p.description || "Website Design Project"}</p>
                    </div>
                  ))}
                </div>

                {/* Project Workspace Details */}
                {selectedProject && (
                  <div className="lg:col-span-2 space-y-6">
                    {/* Project Header Banner */}
                    <Card className="rounded-3xl border-slate-100 bg-white shadow-sm p-6 sm:p-7 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-extrabold text-slate-900">{selectedProject.name}</h2>
                            {getStatusBadge(selectedProject.status)}
                          </div>
                          <p className="text-xs text-slate-500">
                            {selectedProject.description || "Web application & design milestone"}
                          </p>
                        </div>

                        <Button
                          onClick={() => setIsRevisionOpen(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold h-10 px-4"
                        >
                          <Plus className="w-4 h-4 mr-1.5" />
                          Request Revision / Feedback
                        </Button>
                      </div>

                      {/* Links Bar */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                        {selectedProject.preview_url && (
                          <a
                            href={selectedProject.preview_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
                          >
                            <Globe className="w-4 h-4" />
                            Preview Staging Site
                            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                          </a>
                        )}

                        {selectedProject.figma_url && (
                          <a
                            href={selectedProject.figma_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold transition-colors"
                          >
                            <Figma className="w-4 h-4" />
                            Open Figma Design
                            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                          </a>
                        )}
                      </div>
                    </Card>

                    {/* Revisions & Feedback Stream */}
                    <Card className="rounded-3xl border-slate-100 bg-white shadow-sm p-6 sm:p-7 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                            <RefreshCw className="w-4 h-4" />
                          </div>
                          <h3 className="font-bold text-sm text-slate-900">
                            Submitted Feedback & Change Requests
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400">
                          {selectedProject.revisions?.length || 0} total
                        </span>
                      </div>

                      {(!selectedProject.revisions || selectedProject.revisions.length === 0) ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No change requests submitted yet. Click "Request Revision" above to submit feedback.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedProject.revisions.map((rev) => (
                            <div
                              key={rev.id}
                              className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900">{rev.title}</span>
                                {getStatusBadge(rev.status)}
                              </div>
                              <p className="text-xs text-slate-600">{rev.description}</p>
                              {rev.page_url && (
                                <span className="text-[11px] text-blue-600 font-mono block">
                                  Page: {rev.page_url}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Invoices */}
        {activeTab === "INVOICES" && (
          <Card className="rounded-3xl border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Billing & Official Invoices</h3>
              </div>
            </div>

            {invoices.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                No invoices issued for your account yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-3 px-6">Invoice #</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Amount (incl. GST)</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-6 font-bold text-slate-900">{inv.invoice_number}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {new Date(inv.due_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(inv.status)}</td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900">
                          ₹{Number(inv.total_amount).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="rounded-xl border-slate-200 text-xs h-8"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1" />
                            Print / PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </main>

      {/* Revision Modal */}
      {isRevisionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl transition-all my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Submit Design Feedback</h3>
                  <p className="text-xs text-slate-500">Sent directly to your design team</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRevisionOpen(false)}
                className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {revisionError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {revisionError}
              </div>
            )}

            {revisionSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {revisionSuccess}
              </div>
            )}

            <form onSubmit={handleRevisionSubmit} className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">Feedback Category</label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                >
                  <option value="CONTENT_CHANGE">Content / Copy Update</option>
                  <option value="DESIGN_APPROVAL">Layout & Design Feedback</option>
                  <option value="BUG_FIX">Bug / Issue Fix</option>
                  <option value="FEATURE_REQUEST">Feature Request</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">Title / Section *</label>
                <Input
                  value={revisionTitle}
                  onChange={(e) => setRevisionTitle(e.target.value)}
                  placeholder="e.g. Change pricing table header text"
                  className="rounded-xl border-slate-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">Page / Route (Optional)</label>
                <Input
                  value={revisionUrl}
                  onChange={(e) => setRevisionUrl(e.target.value)}
                  placeholder="e.g. /pricing or /contact-us"
                  className="rounded-xl border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">Detailed Feedback *</label>
                <textarea
                  value={revisionDesc}
                  onChange={(e) => setRevisionDesc(e.target.value)}
                  placeholder="Please describe exactly what needs to be updated..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs min-h-[90px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRevisionOpen(false)}
                  className="rounded-xl border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Feedback"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
