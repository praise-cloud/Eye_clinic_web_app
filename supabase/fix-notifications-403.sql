-- Fix notifications 403 Forbidden error
-- Run this in Supabase SQL Editor (use individual statements if batch fails)

-- 1. Drop existing notification policies (if they exist)
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;

-- 2. Recreate policies with correct permissions
-- Allow any authenticated user to insert notifications (for sending to other users)
CREATE POLICY "notifications_insert" ON public.notifications 
    FOR INSERT TO authenticated 
    WITH CHECK (true);

-- Users can only see their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications 
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

-- Users can only update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON public.notifications 
    FOR UPDATE TO authenticated 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can only delete their own notifications
CREATE POLICY "notifications_delete_own" ON public.notifications 
    FOR DELETE TO authenticated 
    USING (user_id = auth.uid());

-- 3. Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'notifications';
