-- Fix audit_logs RLS policy
-- Replaces get_user_role() with direct subquery to avoid potential issues
-- Run this in Supabase SQL Editor

DROP POLICY IF EXISTS "audit_logs_select_admin_manager" ON public.audit_logs;

CREATE POLICY "audit_logs_select_admin_manager" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- Verify
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'audit_logs';

SELECT 'audit_logs RLS fixed' as status;
