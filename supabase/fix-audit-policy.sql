-- Fix audit_logs RLS policy: only manager can read audit logs
-- Run this in Supabase SQL Editor

-- Drop existing policy (allows admin + manager)
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;

-- Create new policy: only manager can read
CREATE POLICY "audit_logs_select" ON public.audit_logs 
  FOR SELECT TO authenticated 
  USING (get_user_role() = 'manager');

-- Verify the policy
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'audit_logs' AND cmd = 'SELECT';

SELECT 'Audit logs RLS policy updated: only manager can read' as status;
