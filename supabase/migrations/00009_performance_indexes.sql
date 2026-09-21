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
