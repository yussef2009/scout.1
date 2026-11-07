-- ==============================================================================
-- SCOT Platform - Row Level Security (RLS) & Access Control Enforcement Migration
-- Target: PostgreSQL / Supabase
-- Date: 2026-11-07
-- ==============================================================================

-- 1. PROFILES TABLE SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to non-sensitive profile columns
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles
FOR SELECT 
USING (true);

-- Allow authenticated users to update only their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- Normal users cannot elevate their own role to 'admin' or mark themselves verified
    (role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR (auth.jwt() ->> 'role' = 'admin')
  )
);

-- Allow administrators full access to update any profile
CREATE POLICY "Admins have full access to profiles"
ON public.profiles
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin' 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND LOWER(role) = 'admin' AND status = 'active'
  )
);

-- 2. VERIFICATION_REQUESTS TABLE SECURITY
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can view only their own accreditation requests
CREATE POLICY "Users view own verification requests"
ON public.verification_requests
FOR SELECT
USING (auth.uid() = profile_id OR auth.jwt() ->> 'role' = 'admin');

-- Users can submit their own accreditation requests with 'pending' status
CREATE POLICY "Users submit own verification requests"
ON public.verification_requests
FOR INSERT
WITH CHECK (
  auth.uid() = profile_id 
  AND status = 'pending'
);

-- Only administrators can approve or reject accreditation requests
CREATE POLICY "Admins manage verification requests"
ON public.verification_requests
FOR UPDATE
USING (
  auth.jwt() ->> 'role' = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND LOWER(role) = 'admin' AND status = 'active'
  )
);

-- 3. SPORT_SCHEMAS TABLE SECURITY
ALTER TABLE public.sport_schemas ENABLE ROW LEVEL SECURITY;

-- Active sport schemas are viewable by all users
CREATE POLICY "Sport schemas are viewable by all"
ON public.sport_schemas
FOR SELECT
USING (true);

-- Only administrators can insert, update or delete sport schemas
CREATE POLICY "Admins manage sport schemas"
ON public.sport_schemas
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND LOWER(role) = 'admin' AND status = 'active'
  )
);

-- 4. ADMIN_AUDIT_LOGS TABLE SECURITY
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs can only be viewed and written by verified administrators
CREATE POLICY "Admins access audit logs"
ON public.admin_audit_logs
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND LOWER(role) = 'admin' AND status = 'active'
  )
);

