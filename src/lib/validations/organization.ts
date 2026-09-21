import { z } from "zod";

export const createClientOrgSchema = z.object({
  businessName: z.string().trim().min(2, "Business name must be at least 2 characters").max(100),
  businessType: z.string().trim().default("OTHER"),
  websiteUrl: z.string().trim().max(255).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
  email: z.string().trim().email("Invalid business email").or(z.literal("")).optional().default(""),
  address: z.string().trim().max(255).optional().default(""),
  city: z.string().trim().max(100).optional().default(""),
  state: z.string().trim().max(100).optional().default(""),
  country: z.string().trim().max(100).default("India"),
  timezone: z.string().trim().default("Asia/Kolkata"),
  plan: z.enum(["FREE", "PRO", "BUSINESS"]).default("FREE"),
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE", "PENDING"]).default("ACTIVE"),
  ownerName: z.string().trim().min(2, "Contact owner name is required").max(100),
  ownerEmail: z.string().trim().email("A valid owner email address is required"),
  ownerPhone: z.string().trim().max(30).optional().default(""),
  enabledModules: z.array(z.string()).default(["leads", "whatsapp", "analytics", "ads"]),
});

export type CreateClientOrgInput = z.input<typeof createClientOrgSchema>;

export const updateClientOrgSchema = z.object({
  name: z.string().trim().min(2, "Business name is required").max(100),
  business_type: z.string().trim().optional(),
  website: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  email: z.string().trim().email("Invalid email").or(z.literal("")).optional().default(""),
  address: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  state: z.string().trim().optional().default(""),
  country: z.string().trim().optional().default("India"),
  timezone: z.string().trim().optional().default("Asia/Kolkata"),
  plan: z.enum(["FREE", "PRO", "BUSINESS"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE", "PENDING"]).optional(),
  services: z.array(z.string()).optional(),
});

export type UpdateClientOrgInput = z.input<typeof updateClientOrgSchema>;
