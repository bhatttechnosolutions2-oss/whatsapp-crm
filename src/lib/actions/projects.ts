"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { projectSchema, projectTaskSchema, projectRevisionSchema } from "@/lib/validations/projects";
import { Project, ProjectWithDetails, ProjectStatus, TaskStatus, RevisionStatus, Client, ProjectTask, ProjectRevision } from "@/types/crm";

export interface ProjectActionResult {
  success: boolean;
  error?: string;
  message?: string;
  projectId?: string;
}

async function getAuthenticatedUserOrg() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!member) return null;

  return {
    userId: user.id,
    orgId: member.organization_id,
    role: member.role,
  };
}

export async function createProject(
  prevState: ProjectActionResult | null,
  formData: FormData
): Promise<ProjectActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) {
    return { success: false, error: "Unauthorized access" };
  }

  const rawData = {
    clientId: (formData.get("clientId") as string)?.trim(),
    name: (formData.get("name") as string)?.trim(),
    description: (formData.get("description") as string)?.trim() || "",
    projectType: (formData.get("projectType") as Project["project_type"]) || "WEBSITE_DESIGN",
    status: (formData.get("status") as ProjectStatus) || "PLANNING",
    previewUrl: (formData.get("previewUrl") as string)?.trim() || "",
    productionUrl: (formData.get("productionUrl") as string)?.trim() || "",
    figmaUrl: (formData.get("figmaUrl") as string)?.trim() || "",
    targetLaunchDate: (formData.get("targetLaunchDate") as string)?.trim() || "",
    budget: Number(formData.get("budget")) || 0,
  };

  const validation = projectSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Validation failed",
    };
  }

  try {
    const supabase = await createClient();

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        organization_id: auth.orgId,
        client_id: validation.data.clientId,
        name: validation.data.name,
        description: validation.data.description || null,
        project_type: validation.data.projectType,
        status: validation.data.status,
        preview_url: validation.data.previewUrl || null,
        production_url: validation.data.productionUrl || null,
        figma_url: validation.data.figmaUrl || null,
        target_launch_date: validation.data.targetLaunchDate || null,
        budget: validation.data.budget,
      })
      .select("id")
      .single();

    if (error || !project) {
      return { success: false, error: error?.message || "Failed to create project" };
    }

    // Create standard default onboarding tasks
    await supabase.from("project_tasks").insert([
      {
        organization_id: auth.orgId,
        project_id: project.id,
        title: "Client Onboarding & Assets Collection",
        status: "DONE",
        priority: "HIGH",
      },
      {
        organization_id: auth.orgId,
        project_id: project.id,
        title: "Wireframes & UI Design Mockups",
        status: "IN_PROGRESS",
        priority: "HIGH",
      },
      {
        organization_id: auth.orgId,
        project_id: project.id,
        title: "Frontend Development & Content Integration",
        status: "TODO",
        priority: "MEDIUM",
      },
      {
        organization_id: auth.orgId,
        project_id: project.id,
        title: "Client Review & Design Approval",
        status: "TODO",
        priority: "HIGH",
      },
      {
        organization_id: auth.orgId,
        project_id: project.id,
        title: "Domain Setup & Production Launch",
        status: "TODO",
        priority: "URGENT",
      },
    ]);

    revalidatePath("/app/projects");
    revalidatePath("/app/clients");

    return {
      success: true,
      message: "Project created successfully",
      projectId: project.id,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error creating project",
    };
  }
}

export async function updateProjectStatus(
  projectId: string,
  newStatus: ProjectStatus
): Promise<ProjectActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("projects")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", projectId)
      .eq("organization_id", auth.orgId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/app/projects/${projectId}`);
    revalidatePath("/app/projects");

    return { success: true, message: `Status updated to ${newStatus}` };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update status",
    };
  }
}

export async function createProjectTask(
  projectId: string,
  prevState: ProjectActionResult | null,
  formData: FormData
): Promise<ProjectActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) {
    return { success: false, error: "Unauthorized access" };
  }

  const rawData = {
    title: (formData.get("title") as string)?.trim(),
    description: (formData.get("description") as string)?.trim() || "",
    status: (formData.get("status") as TaskStatus) || "TODO",
    priority: (formData.get("priority") as ProjectActionResult["error"]) || "MEDIUM",
    dueDate: (formData.get("dueDate") as string)?.trim() || "",
  };

  const validation = projectTaskSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Invalid task data",
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("project_tasks").insert({
      organization_id: auth.orgId,
      project_id: projectId,
      title: validation.data.title,
      description: validation.data.description || null,
      status: validation.data.status,
      priority: validation.data.priority,
      due_date: validation.data.dueDate || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/app/projects/${projectId}`);
    return { success: true, message: "Task added successfully" };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to add task",
    };
  }
}

export async function updateTaskStatus(
  taskId: string,
  projectId: string,
  newStatus: TaskStatus
): Promise<ProjectActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("project_tasks")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .eq("organization_id", auth.orgId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/app/projects/${projectId}`);
    return { success: true, message: "Task status updated" };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update task",
    };
  }
}

export async function createProjectRevision(
  projectId: string,
  prevState: ProjectActionResult | null,
  formData: FormData
): Promise<ProjectActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) {
    return { success: false, error: "Unauthorized access" };
  }

  const rawData = {
    title: (formData.get("title") as string)?.trim(),
    description: (formData.get("description") as string)?.trim(),
    pageUrl: (formData.get("pageUrl") as string)?.trim() || "",
    feedbackType: (formData.get("feedbackType") as ProjectActionResult["error"]) || "DESIGN_APPROVAL",
  };

  const validation = projectRevisionSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Invalid revision data",
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("project_revisions").insert({
      organization_id: auth.orgId,
      project_id: projectId,
      title: validation.data.title,
      description: validation.data.description,
      page_url: validation.data.pageUrl || null,
      feedback_type: validation.data.feedbackType,
      status: "PENDING",
      created_by: auth.userId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/app/projects/${projectId}`);
    return { success: true, message: "Revision / Approval request submitted" };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create revision",
    };
  }
}

export async function updateRevisionStatus(
  revisionId: string,
  projectId: string,
  newStatus: RevisionStatus
): Promise<ProjectActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("project_revisions")
      .update({
        status: newStatus,
        resolved_at: newStatus === "RESOLVED" || newStatus === "ACCEPTED" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", revisionId)
      .eq("organization_id", auth.orgId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/app/projects/${projectId}`);
    return { success: true, message: `Revision updated to ${newStatus}` };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update revision",
    };
  }
}

export async function getProjectsData(): Promise<ProjectWithDetails[]> {
  try {
    const auth = await getAuthenticatedUserOrg();
    if (!auth) return [];

    const supabase = await createClient();

    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", auth.orgId)
      .order("created_at", { ascending: false });

    if (error || !projects) return [];

    // Fetch clients
    const { data: clients } = await supabase
      .from("clients")
      .select("*")
      .eq("organization_id", auth.orgId);

    // Fetch tasks
    const { data: tasks } = await supabase
      .from("project_tasks")
      .select("id, project_id, status")
      .eq("organization_id", auth.orgId);

    const allClients = clients || [];
    const allTasks = tasks || [];

    return projects.map((p) => {
      const client = allClients.find((c) => c.id === p.client_id);
      const projectTasks = allTasks.filter((t) => t.project_id === p.id);
      const total = projectTasks.length;
      const done = projectTasks.filter((t) => t.status === "DONE").length;
      const inProgress = projectTasks.filter((t) => t.status === "IN_PROGRESS").length;
      const todo = projectTasks.filter((t) => t.status === "TODO").length;

      return {
        ...p,
        client,
        taskStats: { total, done, inProgress, todo },
      };
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export async function getProjectDetails(projectId: string): Promise<ProjectWithDetails | null> {
  try {
    const auth = await getAuthenticatedUserOrg();
    if (!auth) return null;

    const supabase = await createClient();

    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("organization_id", auth.orgId)
      .maybeSingle();

    if (error || !project) return null;

    // Fetch client
    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", project.client_id)
      .maybeSingle();

    const { data: tasks } = await supabase
      .from("project_tasks")
      .select("*")
      .eq("project_id", projectId)
      .eq("organization_id", auth.orgId)
      .order("created_at", { ascending: true });

    const { data: revisions } = await supabase
      .from("project_revisions")
      .select("*")
      .eq("project_id", projectId)
      .eq("organization_id", auth.orgId)
      .order("created_at", { ascending: false });

    const allTasks = tasks || [];
    const total = allTasks.length;
    const done = allTasks.filter((t) => t.status === "DONE").length;
    const inProgress = allTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const todo = allTasks.filter((t) => t.status === "TODO").length;

    return {
      ...project,
      client: client || undefined,
      tasks: allTasks,
      revisions: revisions || [],
      taskStats: { total, done, inProgress, todo },
    };
  } catch (error) {
    console.error("Error fetching project details:", error);
    return null;
  }
}
