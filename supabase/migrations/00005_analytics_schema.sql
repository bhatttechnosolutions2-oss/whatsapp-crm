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

CREATE POLICY "Service can insert website visitors"
    ON public.website_visitors
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service can update website visitors"
    ON public.website_visitors
    FOR UPDATE
    USING (true);

-- Website Events RLS
CREATE POLICY "Members can view org website events"
    ON public.website_events
    FOR SELECT
    USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Service can insert website events"
    ON public.website_events
    FOR INSERT
    WITH CHECK (true);
