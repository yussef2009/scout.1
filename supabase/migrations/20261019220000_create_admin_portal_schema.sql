-- Scot Sports Analytics - Admin Portal & Accreditation Schema Migration
-- Migration: 20261019220000_create_admin_portal_schema.sql

-- 1. Extend profiles table with verification and administrative controls
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS ban_reason text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS organization_type text,
  ADD COLUMN IF NOT EXISTS license_number text;

-- 2. Create security definer helper to check admin role without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT (
    COALESCE(auth.jwt() ->> 'role', '') = 'admin' OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND lower(role) = 'admin'
    )
  );
$$;

-- 3. Create verification_requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  organization_name text NOT NULL,
  license_number text,
  phone text,
  document_url text,
  document_type text NOT NULL DEFAULT 'Accreditation Badge & License',
  proof_file_name text,
  notes text,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_feedback text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- 4. Create sport_schemas table for dynamic sport metric manager
CREATE TABLE IF NOT EXISTS public.sport_schemas (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'activity',
  is_active boolean NOT NULL DEFAULT true,
  metrics jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.sport_schemas ENABLE ROW LEVEL SECURITY;

-- 5. Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id),
  admin_email text,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Permissions & Grants
GRANT ALL ON public.verification_requests TO authenticated;
GRANT ALL ON public.sport_schemas TO authenticated;
GRANT ALL ON public.admin_audit_logs TO authenticated;

-- 7. Policies
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can select verification requests"
  ON public.verification_requests FOR SELECT
  TO authenticated
  USING (public.is_admin() OR (auth.uid() = profile_id));

CREATE POLICY "Admins can update verification requests"
  ON public.verification_requests FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can create verification requests"
  ON public.verification_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Sport schemas are viewable by all"
  ON public.sport_schemas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can modify sport schemas"
  ON public.sport_schemas FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());
