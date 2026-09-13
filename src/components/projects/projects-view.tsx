"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProjectWithDetails, ClientWithProjects, ProjectStatus } from "@/types/crm";
import { AddProjectDialog } from "./add-project-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNumber } from "@/lib/utils";
import {
  FolderKanban,
  Plus,
  Search,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  Building,
  Figma,
  ArrowRight,
} from "lucide-react";

interface ProjectsViewProps {
  initialProjects: ProjectWithDetails[];
  clients: ClientWithProjects[];
}

const statusMap: Record<
  ProjectStatus,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" }
> = {
  PLANNING: { label: "Planning", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  REVIEW: { label: "In Review", variant: "warning" },
  APPROVED: { label: "Design Approved", variant: "success" },
  COMPLETED: { label: "Completed", variant: "success" },
  ON_HOLD: { label: "On Hold", variant: "destructive" },
};

export function ProjectsView({ initialProjects, clients }: ProjectsViewProps) {
  const [projects, setProjects] = useState<ProjectWithDetails[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  React.useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const filteredProjects = projects.filter((project) => {
    const matchesStatus =
      statusFilter === "ALL" || project.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      project.name.toLowerCase().includes(query) ||
      (project.client?.company_name &&
        project.client.company_name.toLowerCase().includes(query)) ||
      (project.client?.full_name &&
        project.client.full_name.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Website & Client Projects
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track website builds, client design reviews, tasks, and production deployments
          </p>
        </div>

        <Button
          onClick={() => setIsAddDialogOpen(true)}
          size="sm"
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Projects" },
            { id: "IN_PROGRESS", label: "In Progress" },
            { id: "REVIEW", label: "Client Review" },
            { id: "APPROVED", label: "Approved" },
            { id: "COMPLETED", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <EmptyState
            icon={<FolderKanban className="h-8 w-8 text-slate-400" />}
            title={
              searchQuery || statusFilter !== "ALL"
                ? "No projects match your filter"
                : "No active projects yet"
            }
            description={
              searchQuery || statusFilter !== "ALL"
                ? "Try adjusting your search criteria or filter tags."
                : "Create your first client website project to start tracking milestones and design approvals."
            }
            action={
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                size="sm"
                className="flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const totalTasks = project.taskStats?.total || 0;
            const doneTasks = project.taskStats?.done || 0;
            const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
            const statusConfig = statusMap[project.status] || { label: project.status, variant: "default" };

            return (
              <div
                key={project.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={statusConfig.variant} className="text-[10px]">
                      {statusConfig.label}
                    </Badge>
                    <span className="text-xs font-bold text-slate-900">
                      ₹{formatNumber(project.budget || 0)}
                    </span>
                  </div>

                  {/* Project Title & Client */}
                  <div className="mt-3">
                    <Link
                      href={`/app/projects/${project.id}`}
                      className="font-bold text-base text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {project.name}
                    </Link>
                    {project.client && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        {project.client.company_name || project.client.full_name}
                      </p>
                    )}
                  </div>

                  {/* Task Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Tasks & Milestones</span>
                      <span className="font-semibold text-slate-700">
                        {doneTasks}/{totalTasks} ({progressPercent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta Details */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                    {project.target_launch_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Target:{" "}
                          {new Date(project.target_launch_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Links */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {project.figma_url && (
                      <a
                        href={project.figma_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        title="Figma Mockup"
                      >
                        <Figma className="h-4 w-4" />
                      </a>
                    )}
                    {project.preview_url && (
                      <a
                        href={project.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Live Preview"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  <Link href={`/app/projects/${project.id}`}>
                    <Button size="sm" variant="ghost" className="text-xs flex items-center gap-1">
                      Workspace
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Project Modal */}
      <AddProjectDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        clients={clients}
      />
    </div>
  );
}
