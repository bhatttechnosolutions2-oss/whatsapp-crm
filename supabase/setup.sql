-- ==============================================================================
-- Migration: 00001_initial_schema.sql
-- Description: Core schema for Simple Business CRM + Client Portal Multi-Tenant SaaS
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on slug for fast subdomain/tenant resolution
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);

-- 2. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. ORGANIZATION MEMBERS TABLE (Multi-tenant memberships and roles)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN (
        'SUPER_ADMIN',
        'ADMIN',
        'SALES',
        'PROJECT_MANAGER',
        'DEVELOPER',
        'DESIGNER',
        'QA',
        'CLIENT'
    )) DEFAULT 'ADMIN',
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INVITED', 'SUSPENDED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_org_user UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members(role);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON public.organization_members(status);

-- 4. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Updated_at trigger helper
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_organizations_updated_at ON public.organizations;
CREATE TRIGGER set_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_org_members_updated_at ON public.organization_members;
CREATE TRIGGER set_org_members_updated_at
    BEFORE UPDATE ON public.organization_members
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- ==============================================================================
-- Migration: 00002_rls_policies.sql
-- Description: Multi-Tenant Row Level Security (RLS) Policies & Helper Functions
-- ==============================================================================

-- Enable Row Level Security on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Security Definer Helper Functions (To avoid infinite recursion in RLS policies)
-- ------------------------------------------------------------------------------

-- Check if a user belongs to an organization with ACTIVE status
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members
    WHERE organization_id = p_org_id 
      AND user_id = p_user_id
      AND status = 'ACTIVE'
  );
$$;

-- Check if user has specific roles in an organization
CREATE OR REPLACE FUNCTION public.has_org_role(p_org_id UUID, p_roles TEXT[], p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members
    WHERE organization_id = p_org_id 
      AND user_id = p_user_id
      AND status = 'ACTIVE'
      AND role = ANY(p_roles)
  );
$$;

-- Get all active organization IDs for a user
CREATE OR REPLACE FUNCTION public.get_user_org_ids(p_user_id UUID DEFAULT auth.uid())
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id 
  FROM public.organization_members
  WHERE user_id = p_user_id 
    AND status = 'ACTIVE';
$$;

-- ------------------------------------------------------------------------------
-- 1. ORGANIZATIONS POLICIES
-- ------------------------------------------------------------------------------

-- Members can view their organization
CREATE POLICY "Members can view their organizations"
    ON public.organizations
    FOR SELECT
    USING (
        id IN (SELECT public.get_user_org_ids(auth.uid()))
    );

-- Any authenticated user can create an organization (on registration)
CREATE POLICY "Authenticated users can create an organization"
    ON public.organizations
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Only ADMIN and SUPER_ADMIN can update their organization
CREATE POLICY "Admins can update their organization"
    ON public.organizations
    FOR UPDATE
    USING (
        public.has_org_role(id, ARRAY['ADMIN', 'SUPER_ADMIN'], auth.uid())
    )
    WITH CHECK (
        public.has_org_role(id, ARRAY['ADMIN', 'SUPER_ADMIN'], auth.uid())
    );

-- ------------------------------------------------------------------------------
-- 2. PROFILES POLICIES
-- ------------------------------------------------------------------------------

-- Users can view their own profile or profiles of members in the same organization
CREATE POLICY "Users can view relevant profiles"
    ON public.profiles
    FOR SELECT
    USING (
        id = auth.uid() OR
        id IN (
            SELECT user_id 
            FROM public.organization_members 
            WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
        )
    );

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (
        id = auth.uid()
    );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (
        id = auth.uid()
    )
    WITH CHECK (
        id = auth.uid()
    );

-- ------------------------------------------------------------------------------
-- 3. ORGANIZATION MEMBERS POLICIES
-- ------------------------------------------------------------------------------

-- Members can view member records within their organizations
CREATE POLICY "Members can view org members"
    ON public.organization_members
    FOR SELECT
    USING (
        organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
    );

-- Allow inserting membership when user is an admin or during initial self-registration
CREATE POLICY "Admins or initial registration can insert members"
    ON public.organization_members
    FOR INSERT
    WITH CHECK (
        (user_id = auth.uid()) OR
        public.has_org_role(organization_id, ARRAY['ADMIN', 'SUPER_ADMIN'], auth.uid())
    );

-- Admins can update membership roles and statuses
CREATE POLICY "Admins can update org members"
    ON public.organization_members
    FOR UPDATE
    USING (
        public.has_org_role(organization_id, ARRAY['ADMIN', 'SUPER_ADMIN'], auth.uid())
    )
    WITH CHECK (
        public.has_org_role(organization_id, ARRAY['ADMIN', 'SUPER_ADMIN'], auth.uid())
    );

-- Admins can delete members
CREATE POLICY "Admins can delete org members"
    ON public.organization_members
    FOR DELETE
    USING (
        public.has_org_role(organization_id, ARRAY['ADMIN', 'SUPER_ADMIN'], auth.uid())
    );

-- ------------------------------------------------------------------------------
-- 4. AUDIT LOGS POLICIES
-- ------------------------------------------------------------------------------

-- Org members can view audit logs of their organization (except CLIENT role)
CREATE POLICY "Staff can view org audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (
        public.is_org_member(organization_id, auth.uid()) AND
        NOT public.has_org_role(organization_id, ARRAY['CLIENT'], auth.uid())
    );

-- Authenticated users can insert audit logs for their active organization
CREATE POLICY "Members can insert audit logs"
    ON public.audit_logs
    FOR INSERT
    WITH CHECK (
        public.is_org_member(organization_id, auth.uid())
    );
-- ==============================================================================
-- Migration: 00003_leads_schema.sql
-- Description: Leads, Lead Activities, and Ingestion API Keys Schema with RLS
-- ==============================================================================

-- 1. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    company TEXT,
    source TEXT NOT NULL CHECK (source IN (
        'WHATSAPP',
        'WEBSITE_FORM',
        'MANUAL',
        'GOOGLE_ADS',
        'META_ADS',
        'REFERRAL',
        'OTHER'
    )) DEFAULT 'MANUAL',
    status TEXT NOT NULL CHECK (status IN (
        'NEW',
        'CONTACTED',
        'QUALIFIED',
        'PROPOSAL_SENT',
        'WON',
        'LOST'
    )) DEFAULT 'NEW',
    estimated_value NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for fast querying & pipeline sorting
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);

-- 2. LEAD ACTIVITIES & TIMELINE TABLE
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN (
        'NOTE',
        'CALL',
        'WHATSAPP_MESSAGE',
        'EMAIL',
        'MEETING',
        'STATUS_CHANGE',
        'FOLLOW_UP'
    )) DEFAULT 'NOTE',
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_org_id ON public.lead_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON public.lead_activities(created_at DESC);

-- 3. API KEYS TABLE (For public website form ingestion & webhook integration)
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_api_keys_org_id ON public.api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_leads_updated_at ON public.leads;
CREATE TRIGGER set_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Leads RLS
CREATE POLICY "Members can view org leads"
    ON public.leads
    FOR SELECT
    USING (
        organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
    );

CREATE POLICY "Members can create org leads"
    ON public.leads
    FOR INSERT
    WITH CHECK (
        organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
    );

CREATE POLICY "Members can update org leads"
    ON public.leads
    FOR UPDATE
    USING (
        organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
    )
    WITH CHECK (
        organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
    );

CREATE POLICY "Admins can delete org leads"
    ON public.leads
    FOR DELETE
    USING (
        public.has_org_role(organization_id, ARRAY['ADMIN', 'SUPER_ADMIN'], auth.uid())
    );

-- Lead Activities RLS
CREATE POLICY "Members can view lead activities"
    ON public.lead_activities
    FOR SELECT
    USING (
        organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
    );

CREATE POLICY "Members can insert lead activities"
    ON public.lead_activities
    FOR INSERT
    WITH CHECK (
        organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
    );

-- API Keys RLS
CREATE POLICY "Admins can manage api keys"
    ON public.api_keys
    FOR ALL
    USING (
        public.has_org_role(organization_id, ARRAY['ADMIN', 'SUPER_ADMIN'], auth.uid())
    );
-- ==============================================================================
-- Migration: 00004_clients_projects_schema.sql
-- Description: Clients, Website Projects, Tasks, and Design Approvals Schema with RLS
-- ==============================================================================

-- 1. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    company_name TEXT,
    website_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')) DEFAULT 'ACTIVE',
    portal_access_enabled BOOLEAN NOT NULL DEFAULT false,
    portal_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clients_org_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    project_type TEXT NOT NULL CHECK (project_type IN (
        'WEBSITE_DESIGN',
        'ECOMMERCE',
        'WEB_APP',
        'LANDING_PAGE',
        'SEO_MARKETING',
        'MAINTENANCE',
        'OTHER'
    )) DEFAULT 'WEBSITE_DESIGN',
    status TEXT NOT NULL CHECK (status IN (
        'PLANNING',
        'IN_PROGRESS',
        'REVIEW',
        'APPROVED',
        'COMPLETED',
        'ON_HOLD'
    )) DEFAULT 'PLANNING',
    preview_url TEXT,
    production_url TEXT,
    figma_url TEXT,
    target_launch_date DATE,
    budget NUMERIC(12,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_projects_org_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- 3. PROJECT TASKS TABLE
CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE')) DEFAULT 'TODO',
    priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')) DEFAULT 'MEDIUM',
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_org_id ON public.project_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON public.project_tasks(status);

-- 4. PROJECT REVISIONS & DESIGN APPROVALS TABLE
CREATE TABLE IF NOT EXISTS public.project_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    page_url TEXT,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN (
        'DESIGN_APPROVAL',
        'CONTENT_CHANGE',
        'BUG_FIX',
        'FEATURE_REQUEST',
        'GENERAL'
    )) DEFAULT 'DESIGN_APPROVAL',
    status TEXT NOT NULL CHECK (status IN (
        'PENDING',
        'ACCEPTED',
        'IN_PROGRESS',
        'RESOLVED',
        'REJECTED'
    )) DEFAULT 'PENDING',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_revisions_project_id ON public.project_revisions(project_id);
CREATE INDEX IF NOT EXISTS idx_revisions_org_id ON public.project_revisions(organization_id);
CREATE INDEX IF NOT EXISTS idx_revisions_status ON public.project_revisions(status);

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_project_tasks_updated_at ON public.project_tasks;
CREATE TRIGGER set_project_tasks_updated_at
    BEFORE UPDATE ON public.project_tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_project_revisions_updated_at ON public.project_revisions;
CREATE TRIGGER set_project_revisions_updated_at
    BEFORE UPDATE ON public.project_revisions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_revisions ENABLE ROW LEVEL SECURITY;

-- Clients RLS
CREATE POLICY "Members can view org clients"
    ON public.clients
    FOR SELECT
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Members can create org clients"
    ON public.clients
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Members can update org clients"
    ON public.clients
    FOR UPDATE
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Admins can delete org clients"
    ON public.clients
    FOR DELETE
    USING (public.has_org_role(organization_id, ARRAY['ADMIN', 'SUPER_ADMIN'], auth.uid()));

-- Projects RLS
CREATE POLICY "Members can view org projects"
    ON public.projects
    FOR SELECT
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Members can create org projects"
    ON public.projects
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Members can update org projects"
    ON public.projects
    FOR UPDATE
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Admins can delete org projects"
    ON public.projects
    FOR DELETE
    USING (public.has_org_role(organization_id, ARRAY['ADMIN', 'SUPER_ADMIN'], auth.uid()));

-- Tasks RLS
CREATE POLICY "Members can manage project tasks"
    ON public.project_tasks
    FOR ALL
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Revisions RLS
CREATE POLICY "Members can manage project revisions"
    ON public.project_revisions
    FOR ALL
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
-- ==============================================================================
-- Migration: 00005_analytics_schema.sql
-- Description: Website Visitor Analytics, Sessions, Events, and Heartbeats Schema with RLS
-- ==============================================================================

-- 1. WEBSITE VISITORS & SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.website_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    page_url TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    device_type TEXT NOT NULL CHECK (device_type IN ('MOBILE', 'DESKTOP', 'TABLET', 'OTHER')) DEFAULT 'DESKTOP',
    browser TEXT,
    os TEXT,
    country TEXT DEFAULT 'India',
    city TEXT,
    ip_address TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_visitors_org_id ON public.website_visitors(organization_id);
CREATE INDEX IF NOT EXISTS idx_visitors_session_id ON public.website_visitors(session_id);
CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON public.website_visitors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_heartbeat ON public.website_visitors(last_heartbeat_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_utm_source ON public.website_visitors(utm_source);

-- 2. WEBSITE EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.website_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    session_id TEXT,
    event_name TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_events_org_id ON public.website_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_name ON public.website_events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.website_events(created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.website_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_events ENABLE ROW LEVEL SECURITY;

-- Website Visitors RLS
CREATE POLICY "Members can view org website visitors"
    ON public.website_visitors
    FOR SELECT
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Website Events RLS
CREATE POLICY "Members can view org website events"
    ON public.website_events
    FOR SELECT
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- ==============================================================================
-- Migration: 00006_payments_ads_schema.sql
-- Description: Invoices, Invoice Items, and Ad Campaigns Schema with RLS
-- ==============================================================================

-- 1. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED')) DEFAULT 'DRAFT',
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 18.00,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    payment_method TEXT,
    payment_reference TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);

-- 2. INVOICE ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- 3. AD CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('GOOGLE_ADS', 'META_ADS', 'OTHER')) DEFAULT 'GOOGLE_ADS',
    campaign_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED')) DEFAULT 'ACTIVE',
    spend NUMERIC(12,2) NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    leads_generated INTEGER NOT NULL DEFAULT 0,
    cost_per_lead NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_org_id ON public.ad_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_platform ON public.ad_campaigns(platform);

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_invoices_updated_at ON public.invoices;
CREATE TRIGGER set_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_ad_campaigns_updated_at ON public.ad_campaigns;
CREATE TRIGGER set_ad_campaigns_updated_at
    BEFORE UPDATE ON public.ad_campaigns
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage org invoices"
    ON public.invoices
    FOR ALL
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Members can manage invoice items"
    ON public.invoice_items
    FOR ALL
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Members can manage ad campaigns"
    ON public.ad_campaigns
    FOR ALL
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
-- ==============================================================================
-- Migration: 00007_notifications_portal_schema.sql
-- Description: In-App Notifications and Client Portal Schema with RLS
-- ==============================================================================

-- 1. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('NEW_LEAD', 'INVOICE_PAID', 'REVISION_REQUESTED', 'TASK_ASSIGNED', 'SYSTEM')) DEFAULT 'SYSTEM',
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON public.notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- 2. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org notifications"
    ON public.notifications
    FOR SELECT
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Members can update their org notifications"
    ON public.notifications
    FOR UPDATE
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "System can insert notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
-- ==============================================================================
-- Migration: 00008_integrations_schema.sql
-- Description: Integration Hub — Webhook tokens, WhatsApp API, Google Ads, Meta Ads
-- ==============================================================================

-- 1. Add integration columns to organizations table
ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS webhook_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(20), 'hex'),
    ADD COLUMN IF NOT EXISTS webhook_token_alt TEXT UNIQUE DEFAULT encode(gen_random_bytes(20), 'hex'),

    -- WhatsApp API Integration
    ADD COLUMN IF NOT EXISTS whatsapp_provider TEXT CHECK (whatsapp_provider IN ('WATI', 'AISENSY', 'TWILIO', 'INTERAKT', 'CUSTOM')),
    ADD COLUMN IF NOT EXISTS whatsapp_api_key TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp_api_url TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp_phone_number TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp_instance_id TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp_webhook_secret TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
    ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,

    -- Google Ads Integration
    ADD COLUMN IF NOT EXISTS google_ads_customer_id TEXT,
    ADD COLUMN IF NOT EXISTS google_ads_developer_token TEXT,
    ADD COLUMN IF NOT EXISTS google_ads_refresh_token TEXT,
    ADD COLUMN IF NOT EXISTS google_ads_client_id TEXT,
    ADD COLUMN IF NOT EXISTS google_ads_client_secret TEXT,
    ADD COLUMN IF NOT EXISTS google_ads_enabled BOOLEAN NOT NULL DEFAULT false,

    -- Meta (Facebook/Instagram) Ads Integration
    ADD COLUMN IF NOT EXISTS meta_ads_access_token TEXT,
    ADD COLUMN IF NOT EXISTS meta_ads_account_id TEXT,
    ADD COLUMN IF NOT EXISTS meta_ads_app_id TEXT,
    ADD COLUMN IF NOT EXISTS meta_ads_enabled BOOLEAN NOT NULL DEFAULT false;

-- 2. Ensure all existing orgs have webhook tokens
UPDATE public.organizations
    SET webhook_token = encode(gen_random_bytes(20), 'hex')
    WHERE webhook_token IS NULL;

UPDATE public.organizations
    SET webhook_token_alt = encode(gen_random_bytes(20), 'hex')
    WHERE webhook_token_alt IS NULL;

-- 3. Index on webhook token for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_webhook_token ON public.organizations(webhook_token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_webhook_token_alt ON public.organizations(webhook_token_alt);

-- 4. WHATSAPP MESSAGES TABLE (incoming + outgoing log)
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    direction TEXT NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    from_number TEXT NOT NULL,
    to_number TEXT NOT NULL,
    message TEXT NOT NULL,
    media_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('SENT', 'DELIVERED', 'READ', 'FAILED', 'RECEIVED')) DEFAULT 'SENT',
    provider TEXT,
    provider_message_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_wa_messages_org_id ON public.whatsapp_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_lead_id ON public.whatsapp_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_direction ON public.whatsapp_messages(direction);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view org whatsapp messages" ON public.whatsapp_messages;
CREATE POLICY "Members can view org whatsapp messages"
    ON public.whatsapp_messages FOR SELECT
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

DROP POLICY IF EXISTS "Members can insert whatsapp messages" ON public.whatsapp_messages;
CREATE POLICY "Members can insert whatsapp messages"
    ON public.whatsapp_messages FOR INSERT
    WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- 5. ADS CACHE TABLE (store pulled Google/Meta data)
CREATE TABLE IF NOT EXISTS public.ads_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('GOOGLE', 'META')),
    date_range TEXT NOT NULL DEFAULT '7d',
    data JSONB NOT NULL DEFAULT '[]'::jsonb,
    pulled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(organization_id, platform, date_range)
);

CREATE INDEX IF NOT EXISTS idx_ads_cache_org_platform ON public.ads_cache(organization_id, platform);

ALTER TABLE public.ads_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view ads cache" ON public.ads_cache;
CREATE POLICY "Members can view ads cache"
    ON public.ads_cache FOR SELECT
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

DROP POLICY IF EXISTS "Members can manage ads cache" ON public.ads_cache;
CREATE POLICY "Members can manage ads cache"
    ON public.ads_cache FOR ALL
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
-- ==============================================================================
-- Migration: 00009_performance_indexes.sql
-- Description: Composite indexes for high-throughput multi-tenant querying
-- ==============================================================================

-- 1. Leads table: Fast filtering by organization and status (e.g. Kanban columns, status filter)
CREATE INDEX IF NOT EXISTS idx_leads_org_status 
ON public.leads(organization_id, status);

-- 2. Leads table: Fast ordering by created_at per organization (e.g. recent leads list, paginated views)
CREATE INDEX IF NOT EXISTS idx_leads_org_created_at 
ON public.leads(organization_id, created_at DESC);

-- 3. Website visitors table: Fast ordering by recent sessions per organization
CREATE INDEX IF NOT EXISTS idx_visitors_org_created_at 
ON public.website_visitors(organization_id, created_at DESC);

-- 4. Website visitors table: Active visitors query per organization
CREATE INDEX IF NOT EXISTS idx_visitors_org_active_heartbeat 
ON public.website_visitors(organization_id, is_active, last_heartbeat_at DESC);
-- ==============================================================================
-- Migration: 00010_client_onboarding_schema.sql
-- Description: Client Onboarding Wizard, Business Settings, and Organization Lifecycle
-- ==============================================================================

-- 1. Extend organizations table with onboarding & business profile fields
ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PRO', 'BUSINESS')),
    ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'OTHER',
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
    ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS lead_sources TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{"new_lead": true, "follow_up": true, "email": false, "browser": false}'::jsonb,
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS onboarding_step INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS enabled_modules TEXT[] DEFAULT '{"leads", "whatsapp", "analytics", "ads"}',
    ADD COLUMN IF NOT EXISTS owner_contact_name TEXT,
    ADD COLUMN IF NOT EXISTS owner_contact_email TEXT,
    ADD COLUMN IF NOT EXISTS owner_contact_phone TEXT;

-- 2. Indexes for onboarding and status lookups
CREATE INDEX IF NOT EXISTS idx_organizations_onboarding ON public.organizations(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON public.organizations(plan);
