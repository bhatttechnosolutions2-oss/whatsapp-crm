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
