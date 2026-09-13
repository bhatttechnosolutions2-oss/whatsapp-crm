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
