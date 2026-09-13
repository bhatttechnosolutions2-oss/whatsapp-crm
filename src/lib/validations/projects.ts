import { z } from "zod";

export const clientSchema = z.object({
  fullName: z.string().min(2, "Client name must be at least 2 characters"),
  phone: z
    .string()
    .min(10, "Phone number must have at least 10 digits")
    .max(15, "Phone number is too long"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  websiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
});

export const projectSchema = z.object({
  clientId: z.string().min(1, "Please select a client"),
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().optional().or(z.literal("")),
  projectType: z.enum([
    "WEBSITE_DESIGN",
    "ECOMMERCE",
    "WEB_APP",
    "LANDING_PAGE",
    "SEO_MARKETING",
    "MAINTENANCE",
    "OTHER",
  ]).default("WEBSITE_DESIGN"),
  status: z.enum([
    "PLANNING",
    "IN_PROGRESS",
    "REVIEW",
    "APPROVED",
    "COMPLETED",
    "ON_HOLD",
  ]).default("PLANNING"),
  previewUrl: z.string().url("Invalid preview URL").optional().or(z.literal("")),
  productionUrl: z.string().url("Invalid production URL").optional().or(z.literal("")),
  figmaUrl: z.string().url("Invalid Figma URL").optional().or(z.literal("")),
  targetLaunchDate: z.string().optional().or(z.literal("")),
  budget: z.coerce.number().min(0).default(0),
});

export const projectTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional().or(z.literal("")),
});

export const projectRevisionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(2, "Please describe the feedback or revision"),
  pageUrl: z.string().optional().or(z.literal("")),
  feedbackType: z.enum([
    "DESIGN_APPROVAL",
    "CONTENT_CHANGE",
    "BUG_FIX",
    "FEATURE_REQUEST",
    "GENERAL",
  ]).default("DESIGN_APPROVAL"),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectTaskInput = z.infer<typeof projectTaskSchema>;
export type ProjectRevisionInput = z.infer<typeof projectRevisionSchema>;
