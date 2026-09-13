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
