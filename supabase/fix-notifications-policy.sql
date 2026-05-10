-- Fix notifications RLS policies
-- Run this in Supabase SQL Editor

-- Drop only the restrictive insert policy, replace with one that allows cross-user inserts
DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;

CREATE POLICY "notifications_insert" ON public.notifications 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'notifications';

SELECT 'Notifications RLS policies fixed' as status;
