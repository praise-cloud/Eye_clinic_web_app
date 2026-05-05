-- Fix notifications RLS policies
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;

-- Allow any authenticated user to insert notifications (for sending to other users)
CREATE POLICY "notifications_insert" ON public.notifications 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Users can only see their own notifications
CREATE POLICY "notifications_select" ON public.notifications 
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

-- Users can only update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON public.notifications 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);

-- Users can only delete their own notifications
CREATE POLICY "notifications_delete_own" ON public.notifications 
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'notifications';

SELECT 'Notifications RLS policies fixed' as status;
