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
