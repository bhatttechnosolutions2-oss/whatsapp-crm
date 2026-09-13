"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ProjectWithDetails,
  ProjectStatus,
  TaskStatus,
  RevisionStatus,
  ProjectTask,
  ProjectRevision,
} from "@/types/crm";
import {
  updateProjectStatus,
  updateTaskStatus,
  updateRevisionStatus,
} from "@/lib/actions/projects";
import { AddTaskDialog } from "./add-task-dialog";
import { AddRevisionDialog } from "./add-revision-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Figma,
  Globe,
  Plus,
  Building,
  Calendar,
  AlertCircle,
  MessageSquare,
  Phone,
  LayoutList,
  Sparkles,
  FileCheck,
} from "lucide-react";

interface ProjectHubProps {
  project: ProjectWithDetails;
}

const TASK_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "TODO", label: "To Do", color: "bg-slate-400" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-blue-500" },
  { id: "IN_REVIEW", label: "In Review", color: "bg-amber-500" },
  { id: "DONE", label: "Done", color: "bg-emerald-500" },
];

export function ProjectHub({ project: initialProject }: ProjectHubProps) {
  const [project, setProject] = useState<ProjectWithDetails>(initialProject);
  const [activeTab, setActiveTab] = useState<"tasks" | "revisions" | "overview">("tasks");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isRevisionDialogOpen, setIsRevisionDialogOpen] = useState(false);

  React.useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const handleProjectStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ProjectStatus;
    await updateProjectStatus(project.id, newStatus);
    setProject((prev) => ({ ...prev, status: newStatus }));
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTaskStatus(taskId, project.id, newStatus);
    setProject((prev) => {
      const updatedTasks = prev.tasks?.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      );
      return { ...prev, tasks: updatedTasks };
    });
  };

  const handleRevisionStatusChange = async (revisionId: string, newStatus: RevisionStatus) => {
    await updateRevisionStatus(revisionId, project.id, newStatus);
    setProject((prev) => {
      const updatedRevisions = prev.revisions?.map((r) =>
        r.id === revisionId ? { ...r, status: newStatus } : r
      );
      return { ...prev, revisions: updatedRevisions };
    });
  };

  const tasks = project.tasks || [];
  const revisions = project.revisions || [];
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "DONE").length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back Button & Top Header */}
      <div>
        <Link
          href="/app/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Projects
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {project.name}
              </h1>
              <Badge variant="outline" className="text-xs font-semibold">
                {project.project_type.replace("_", " ")}
              </Badge>
            </div>

            {project.client && (
              <p className="mt-1 text-sm text-slate-500 flex items-center gap-1.5">
                <Building className="h-4 w-4 text-slate-400" />
                Client: <span className="font-semibold text-slate-700">{project.client.company_name || project.client.full_name}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Project Phase Selector */}
            <select
              value={project.status}
              onChange={handleProjectStatusChange}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:border-blue-600 focus:outline-none"
            >
              <option value="PLANNING">Planning / Discovery</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Client Review</option>
              <option value="APPROVED">Design Approved</option>
              <option value="COMPLETED">Completed / Live</option>
              <option value="ON_HOLD">On Hold</option>
            </select>

            {/* Quick Link Buttons */}
            {project.preview_url && (
              <a
                href={project.preview_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Preview Site
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Progress & Quick Metrics Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="space-y-1 sm:border-r border-slate-100 pr-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Task Progress
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900">{progressPercent}%</span>
            <span className="text-xs text-slate-500">({doneTasks}/{totalTasks} done)</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-1 sm:border-r border-slate-100 px-0 sm:px-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Project Budget
          </span>
          <p className="text-xl font-bold text-slate-900">
            ₹{formatNumber(project.budget || 0)}
          </p>
        </div>

        <div className="space-y-1 sm:border-r border-slate-100 px-0 sm:px-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Target Launch
          </span>
          <p className="text-sm font-semibold text-slate-800 mt-1">
            {project.target_launch_date
              ? new Date(project.target_launch_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Not scheduled"}
          </p>
        </div>

        <div className="space-y-1 pl-0 sm:pl-4 flex flex-col justify-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Design Assets
          </span>
          <div className="flex items-center gap-2 mt-1">
            {project.figma_url ? (
              <a
                href={project.figma_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:underline"
              >
                <Figma className="h-3.5 w-3.5" />
                Figma File
              </a>
            ) : (
              <span className="text-xs text-slate-400">No Figma link</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2 border-b-2 py-3 text-sm font-semibold transition-colors ${
              activeTab === "tasks"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <LayoutList className="h-4 w-4" />
            Milestones & Tasks ({tasks.length})
          </button>

          <button
            onClick={() => setActiveTab("revisions")}
            className={`flex items-center gap-2 border-b-2 py-3 text-sm font-semibold transition-colors ${
              activeTab === "revisions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileCheck className="h-4 w-4" />
            Design Approvals & Revisions ({revisions.length})
          </button>

          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 border-b-2 py-3 text-sm font-semibold transition-colors ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building className="h-4 w-4" />
            Overview & Deliverables
          </button>
        </nav>
      </div>

      {/* TAB 1: Tasks & Milestones Board */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setIsTaskDialogOpen(true)}
              size="sm"
              className="flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TASK_COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.id);

              return (
                <div
                  key={col.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-100/60 p-3.5 flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {col.label}
                      </h4>
                    </div>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-600 shadow-xs">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 min-h-[220px]">
                    {colTasks.length === 0 ? (
                      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                        No tasks
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-semibold text-xs text-slate-900 leading-snug">
                              {task.title}
                            </h5>
                            <Badge
                              variant={
                                task.priority === "URGENT" || task.priority === "HIGH"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-[9px] px-1.5 py-0 shrink-0"
                            >
                              {task.priority}
                            </Badge>
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            {task.due_date ? (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.due_date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            ) : (
                              <span />
                            )}

                            {/* Move stage selector */}
                            <select
                              value={task.status}
                              onChange={(e) =>
                                handleTaskStatusChange(task.id, e.target.value as TaskStatus)
                              }
                              className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 focus:outline-none"
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="IN_REVIEW">In Review</option>
                              <option value="DONE">Done</option>
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Design Approvals & Revisions */}
      {activeTab === "revisions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Track client design approval requests, page change tickets, and revision resolutions.
            </p>
            <Button
              onClick={() => setIsRevisionDialogOpen(true)}
              size="sm"
              className="flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Request Approval / Revision
            </Button>
          </div>

          {revisions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center">
              <FileCheck className="mx-auto h-8 w-8 text-slate-300" />
              <h4 className="mt-2 text-sm font-semibold text-slate-900">No revisions or design tickets yet</h4>
              <p className="mt-1 text-xs text-slate-500">
                Submit client feedback or request design approvals for specific pages.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{rev.title}</h4>
                      <Badge variant="outline" className="text-[10px]">
                        {rev.feedback_type.replace("_", " ")}
                      </Badge>
                      {rev.page_url && (
                        <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {rev.page_url}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {rev.description}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      Submitted on {new Date(rev.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Badge
                      variant={
                        rev.status === "RESOLVED" || rev.status === "ACCEPTED"
                          ? "success"
                          : rev.status === "IN_PROGRESS"
                          ? "default"
                          : rev.status === "REJECTED"
                          ? "destructive"
                          : "warning"
                      }
                      className="text-xs font-semibold"
                    >
                      {rev.status}
                    </Badge>

                    <select
                      value={rev.status}
                      onChange={(e) =>
                        handleRevisionStatusChange(rev.id, e.target.value as RevisionStatus)
                      }
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved / Approved</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Overview & Deliverables */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Deliverables Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Project Deliverables</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Preview / Staging URL</span>
                {project.preview_url ? (
                  <a
                    href={project.preview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 font-mono"
                  >
                    {project.preview_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">Not configured</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Figma Design Workspace</span>
                {project.figma_url ? (
                  <a
                    href={project.figma_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline flex items-center gap-1 font-mono"
                  >
                    Open Figma
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">Not configured</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Production Live Domain</span>
                {project.production_url ? (
                  <a
                    href={project.production_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline flex items-center gap-1 font-mono"
                  >
                    {project.production_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">Pending domain connection</span>
                )}
              </div>
            </div>

            {project.description && (
              <div className="pt-3 border-t border-slate-100 space-y-1">
                <span className="font-semibold text-xs text-slate-700">Scope & Notes</span>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>
            )}
          </div>

          {/* Client Account Card */}
          {project.client && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Client Details</h3>
              <div className="space-y-3 text-xs text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[11px]">Client Name</span>
                  <span className="font-semibold text-sm text-slate-900">{project.client.full_name}</span>
                </div>
                {project.client.company_name && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Company</span>
                    <span className="font-medium text-slate-800">{project.client.company_name}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block text-[11px]">Phone / WhatsApp</span>
                  <span className="font-mono text-slate-800">{project.client.phone}</span>
                </div>
                {project.client.email && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email Address</span>
                    <span className="text-slate-800">{project.client.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <AddTaskDialog
        projectId={project.id}
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
      />

      <AddRevisionDialog
        projectId={project.id}
        isOpen={isRevisionDialogOpen}
        onClose={() => setIsRevisionDialogOpen(false)}
      />
    </div>
  );
}
