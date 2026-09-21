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
