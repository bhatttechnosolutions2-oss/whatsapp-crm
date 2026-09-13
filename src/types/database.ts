export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SALES"
  | "PROJECT_MANAGER"
  | "DEVELOPER"
  | "DESIGNER"
  | "QA"
  | "CLIENT";

export type MemberStatus = "ACTIVE" | "INVITED" | "SUSPENDED";
export type OrgStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";

export type LeadSource =
  | "WHATSAPP"
  | "WEBSITE_FORM"
  | "MANUAL"
  | "GOOGLE_ADS"
  | "META_ADS"
  | "REFERRAL"
  | "OTHER";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "PROPOSAL_SENT"
  | "WON"
  | "LOST";

export type ActivityType =
  | "NOTE"
  | "CALL"
  | "WHATSAPP_MESSAGE"
  | "EMAIL"
  | "MEETING"
  | "STATUS_CHANGE"
  | "FOLLOW_UP";

export type ClientStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type ProjectType =
  | "WEBSITE_DESIGN"
  | "ECOMMERCE"
  | "WEB_APP"
  | "LANDING_PAGE"
  | "SEO_MARKETING"
  | "MAINTENANCE"
  | "OTHER";

export type ProjectStatus =
  | "PLANNING"
  | "IN_PROGRESS"
  | "REVIEW"
  | "APPROVED"
  | "COMPLETED"
  | "ON_HOLD";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type FeedbackType =
  | "DESIGN_APPROVAL"
  | "CONTENT_CHANGE"
  | "BUG_FIX"
  | "FEATURE_REQUEST"
  | "GENERAL";

export type RevisionStatus =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED";

export type DeviceType = "MOBILE" | "DESKTOP" | "TABLET" | "OTHER";

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
export type AdPlatform = "GOOGLE_ADS" | "META_ADS" | "OTHER";
export type AdCampaignStatus = "ACTIVE" | "PAUSED" | "COMPLETED";
export type NotificationType = "NEW_LEAD" | "INVOICE_PAID" | "REVISION_REQUESTED" | "TASK_ASSIGNED" | "SYSTEM";

export type Database = {
  public: {
    Tables: {
      notifications: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          title: string;
          message: string;
          type: NotificationType;
          link_url: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          title: string;
          message: string;
          type?: NotificationType;
          link_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          title?: string;
          message?: string;
          type?: NotificationType;
          link_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          project_id: string | null;
          invoice_number: string;
          status: InvoiceStatus;
          issue_date: string;
          due_date: string;
          subtotal: number;
          tax_rate: number;
          tax_amount: number;
          total_amount: number;
          notes: string | null;
          payment_method: string | null;
          payment_reference: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          project_id?: string | null;
          invoice_number: string;
          status?: InvoiceStatus;
          issue_date?: string;
          due_date: string;
          subtotal?: number;
          tax_rate?: number;
          tax_amount?: number;
          total_amount?: number;
          notes?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          client_id?: string;
          project_id?: string | null;
          invoice_number?: string;
          status?: InvoiceStatus;
          issue_date?: string;
          due_date?: string;
          subtotal?: number;
          tax_rate?: number;
          tax_amount?: number;
          total_amount?: number;
          notes?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoice_items: {
        Row: {
          id: string;
          organization_id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          invoice_id: string;
          description: string;
          quantity?: number;
          unit_price?: number;
          amount?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          invoice_id?: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          amount?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      ad_campaigns: {
        Row: {
          id: string;
          organization_id: string;
          platform: AdPlatform;
          campaign_name: string;
          status: AdCampaignStatus;
          spend: number;
          impressions: number;
          clicks: number;
          leads_generated: number;
          cost_per_lead: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          platform?: AdPlatform;
          campaign_name: string;
          status?: AdCampaignStatus;
          spend?: number;
          impressions?: number;
          clicks?: number;
          leads_generated?: number;
          cost_per_lead?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          platform?: AdPlatform;
          campaign_name?: string;
          status?: AdCampaignStatus;
          spend?: number;
          impressions?: number;
          clicks?: number;
          leads_generated?: number;
          cost_per_lead?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          timezone: string;
          currency: string;
          status: OrgStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          timezone?: string;
          currency?: string;
          status?: OrgStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          timezone?: string;
          currency?: string;
          status?: OrgStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: UserRole;
          status: MemberStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: UserRole;
          status?: MemberStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: UserRole;
          status?: MemberStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string;
          email: string | null;
          phone: string;
          company: string | null;
          source: LeadSource;
          status: LeadStatus;
          estimated_value: number;
          notes: string | null;
          assigned_to: string | null;
          tags: string[];
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          full_name: string;
          email?: string | null;
          phone: string;
          company?: string | null;
          source?: LeadSource;
          status?: LeadStatus;
          estimated_value?: number;
          notes?: string | null;
          assigned_to?: string | null;
          tags?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          source?: LeadSource;
          status?: LeadStatus;
          estimated_value?: number;
          notes?: string | null;
          assigned_to?: string | null;
          tags?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lead_activities: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string;
          user_id: string | null;
          type: ActivityType;
          title: string;
          description: string | null;
          scheduled_at: string | null;
          completed_at: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id: string;
          user_id?: string | null;
          type: ActivityType;
          title: string;
          description?: string | null;
          scheduled_at?: string | null;
          completed_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string;
          user_id?: string | null;
          type?: ActivityType;
          title?: string;
          description?: string | null;
          scheduled_at?: string | null;
          completed_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string | null;
          full_name: string;
          email: string | null;
          phone: string;
          company_name: string | null;
          website_url: string | null;
          status: ClientStatus;
          portal_access_enabled: boolean;
          portal_user_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id?: string | null;
          full_name: string;
          email?: string | null;
          phone: string;
          company_name?: string | null;
          website_url?: string | null;
          status?: ClientStatus;
          portal_access_enabled?: boolean;
          portal_user_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string | null;
          full_name?: string;
          email?: string | null;
          phone?: string;
          company_name?: string | null;
          website_url?: string | null;
          status?: ClientStatus;
          portal_access_enabled?: boolean;
          portal_user_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          name: string;
          description: string | null;
          project_type: ProjectType;
          status: ProjectStatus;
          preview_url: string | null;
          production_url: string | null;
          figma_url: string | null;
          target_launch_date: string | null;
          budget: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          name: string;
          description?: string | null;
          project_type?: ProjectType;
          status?: ProjectStatus;
          preview_url?: string | null;
          production_url?: string | null;
          figma_url?: string | null;
          target_launch_date?: string | null;
          budget?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          client_id?: string;
          name?: string;
          description?: string | null;
          project_type?: ProjectType;
          status?: ProjectStatus;
          preview_url?: string | null;
          production_url?: string | null;
          figma_url?: string | null;
          target_launch_date?: string | null;
          budget?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_tasks: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: TaskPriority;
          assigned_to: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id: string;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          assigned_to?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          assigned_to?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_revisions: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string;
          title: string;
          description: string;
          page_url: string | null;
          feedback_type: FeedbackType;
          status: RevisionStatus;
          created_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id: string;
          title: string;
          description: string;
          page_url?: string | null;
          feedback_type?: FeedbackType;
          status?: RevisionStatus;
          created_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string;
          title?: string;
          description?: string;
          page_url?: string | null;
          feedback_type?: FeedbackType;
          status?: RevisionStatus;
          created_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      website_visitors: {
        Row: {
          id: string;
          organization_id: string;
          visitor_id: string;
          session_id: string;
          page_url: string;
          page_title: string | null;
          referrer: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          device_type: DeviceType;
          browser: string | null;
          os: string | null;
          country: string | null;
          city: string | null;
          ip_address: string | null;
          duration_seconds: number;
          is_active: boolean;
          last_heartbeat_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          visitor_id: string;
          session_id: string;
          page_url: string;
          page_title?: string | null;
          referrer?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          device_type?: DeviceType;
          browser?: string | null;
          os?: string | null;
          country?: string | null;
          city?: string | null;
          ip_address?: string | null;
          duration_seconds?: number;
          is_active?: boolean;
          last_heartbeat_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          visitor_id?: string;
          session_id?: string;
          page_url?: string;
          page_title?: string | null;
          referrer?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          device_type?: DeviceType;
          browser?: string | null;
          os?: string | null;
          country?: string | null;
          city?: string | null;
          ip_address?: string | null;
          duration_seconds?: number;
          is_active?: boolean;
          last_heartbeat_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      website_events: {
        Row: {
          id: string;
          organization_id: string;
          visitor_id: string;
          session_id: string | null;
          event_name: string;
          event_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          visitor_id: string;
          session_id?: string | null;
          event_name: string;
          event_data?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          visitor_id?: string;
          session_id?: string | null;
          event_name?: string;
          event_data?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          is_active: boolean;
          last_used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          key_hash?: string;
          key_prefix?: string;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
