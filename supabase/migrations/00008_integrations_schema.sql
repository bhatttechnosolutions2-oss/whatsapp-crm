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
