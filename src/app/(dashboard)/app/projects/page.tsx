import React from "react";
import { getProjectsData } from "@/lib/actions/projects";
import { getClientsData } from "@/lib/actions/clients";
import { ProjectsView } from "@/components/projects/projects-view";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([
    getProjectsData(),
    getClientsData(),
  ]);

  return <ProjectsView initialProjects={projects} clients={clients} />;
}
