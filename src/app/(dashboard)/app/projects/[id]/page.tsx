import React from "react";
import { notFound } from "next/navigation";
import { getProjectDetails } from "@/lib/actions/projects";
import { ProjectHub } from "@/components/projects/project-hub";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = await getProjectDetails(id);

  if (!project) {
    notFound();
  }

  return <ProjectHub project={project} />;
}
