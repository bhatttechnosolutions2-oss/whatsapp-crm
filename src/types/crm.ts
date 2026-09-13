import {
  Database,
  UserRole,
  MemberStatus,
  OrgStatus,
  LeadSource,
  LeadStatus,
  ActivityType,
  ClientStatus,
  ProjectType,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  FeedbackType,
  RevisionStatus,
  DeviceType,
  InvoiceStatus,
  AdPlatform,
  AdCampaignStatus,
  NotificationType,
} from './database';

export type Organization = Database['public']['Tables']['organizations']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadActivity = Database['public']['Tables']['lead_activities']['Row'];
export type ApiKey = Database['public']['Tables']['api_keys']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectTask = Database['public']['Tables']['project_tasks']['Row'];
export type ProjectRevision = Database['public']['Tables']['project_revisions']['Row'];
export type WebsiteVisitor = Database['public']['Tables']['website_visitors']['Row'];
export type WebsiteEvent = Database['public']['Tables']['website_events']['Row'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
export type AdCampaign = Database['public']['Tables']['ad_campaigns']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

export type {
  LeadSource,
  LeadStatus,
  ActivityType,
  UserRole,
  MemberStatus,
  OrgStatus,
  ClientStatus,
  ProjectType,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  FeedbackType,
  RevisionStatus,
  DeviceType,
  InvoiceStatus,
  AdPlatform,
  AdCampaignStatus,
  NotificationType,
};

export interface CurrentUserContext {
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
  };
  organization: Organization;
  membership: {
    role: UserRole;
    status: MemberStatus;
  };
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  loading?: boolean;
  className?: string;
}

export interface LeadWithActivities extends Lead {
  activities?: LeadActivity[];
}

export interface ClientWithProjects extends Client {
  projects?: Project[];
  projectCount?: number;
}

export interface ProjectWithDetails extends Project {
  client?: Client;
  tasks?: ProjectTask[];
  revisions?: ProjectRevision[];
  taskStats?: {
    total: number;
    done: number;
    inProgress: number;
    todo: number;
  };
}

export interface DashboardLeadStats {
  visitorsToday: number;
  totalVisitors?: number;
  activeVisitors: number;
  leadsToday: number;
  whatsAppLeads: number;
  whatsAppLeadsToday?: number;
  totalLeads: number;
  recentLeads: Lead[];
}

export interface AnalyticsSummary {
  activeVisitors: number;
  pageViewsToday: number;
  uniqueVisitorsToday: number;
  totalPageViewsAllTime: number;
  totalUniqueVisitorsAllTime: number;
  avgDurationSeconds: number;
  eventConversionsCount: number;
  sourcesBreakdown: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  topPages: Array<{
    url: string;
    views: number;
  }>;
  recentVisitors: WebsiteVisitor[];
}

export interface InvoiceWithDetails extends Invoice {
  client?: Client;
  project?: Project | null;
  items?: InvoiceItem[];
}

export interface PaymentsSummary {
  totalRevenuePaid: number;
  totalPending: number;
  totalOverdue: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  invoices: InvoiceWithDetails[];
}

export interface AdsSummary {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
  avgCostPerLead: number;
  overallCTR: number;
  googleSpend: number;
  metaSpend: number;
  campaigns: AdCampaign[];
}

export interface AiRecommendation {
  id: string;
  category: "LEADS" | "CASHFLOW" | "PROJECTS" | "MARKETING";
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  insight: string;
  actionLabel: string;
  actionUrl: string;
}

export interface AiInsightsSummary {
  healthScore: number;
  healthGrade: "A+" | "A" | "B" | "C" | "NEEDS_ATTENTION";
  winRatePercentage: number;
  avgDealSize: number;
  totalPipelineValue: number;
  marketingEfficiencyRatio: number;
  conversionFunnel: {
    totalLeads: number;
    qualified: number;
    proposals: number;
    won: number;
  };
  recommendations: AiRecommendation[];
}

export interface ClientPortalData {
  client: Client;
  projects: Array<ProjectWithDetails>;
  invoices: Array<InvoiceWithDetails>;
}

export type WhatsAppProvider = 'WATI' | 'AISENSY' | 'TWILIO' | 'INTERAKT' | 'CUSTOM';

export interface OrgIntegrationsConfig {
  orgSlug: string;
  webhookToken: string;
  webhookTokenAlt: string;
  // WhatsApp
  whatsappProvider: WhatsAppProvider | null;
  whatsappApiKey: string | null;
  whatsappApiUrl: string | null;
  whatsappPhoneNumber: string | null;
  whatsappInstanceId: string | null;
  whatsappWebhookSecret: string | null;
  whatsappEnabled: boolean;
  // Google Ads
  googleAdsCustomerId: string | null;
  googleAdsDeveloperToken: string | null;
  googleAdsClientId: string | null;
  googleAdsClientSecret: string | null;
  googleAdsRefreshToken: string | null;
  googleAdsEnabled: boolean;
  // Meta Ads
  metaAdsAccessToken: string | null;
  metaAdsAccountId: string | null;
  metaAdsAppId: string | null;
  metaAdsEnabled: boolean;
}

export interface WhatsAppMessageItem {
  id: string;
  organization_id: string;
  lead_id?: string | null;
  direction: 'INBOUND' | 'OUTBOUND';
  from_number: string;
  to_number: string;
  message: string;
  media_url?: string | null;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'RECEIVED';
  provider?: string | null;
  provider_message_id?: string | null;
  created_at: string;
}

