import { z } from "zod";

export const createLeadSchema = z.object({
  fullName: z.string().min(2, "Lead name must be at least 2 characters"),
  phone: z
    .string()
    .min(10, "Phone number must have at least 10 digits")
    .max(15, "Phone number is too long"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  source: z.enum([
    "WHATSAPP",
    "WEBSITE_FORM",
    "MANUAL",
    "GOOGLE_ADS",
    "META_ADS",
    "REFERRAL",
    "OTHER",
  ]).default("MANUAL"),
  status: z.enum([
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "PROPOSAL_SENT",
    "WON",
    "LOST",
  ]).default("NEW"),
  estimatedValue: z.coerce.number().min(0).default(0),
  notes: z.string().optional().or(z.literal("")),
});

export const updateLeadSchema = createLeadSchema.partial();

export const leadActivitySchema = z.object({
  type: z.enum([
    "NOTE",
    "CALL",
    "WHATSAPP_MESSAGE",
    "EMAIL",
    "MEETING",
    "STATUS_CHANGE",
    "FOLLOW_UP",
  ]),
  title: z.string().min(1, "Activity title is required"),
  description: z.string().optional().or(z.literal("")),
  scheduledAt: z.string().optional().or(z.literal("")),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadActivityInput = z.infer<typeof leadActivitySchema>;
