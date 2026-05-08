-- Fix notifications 403 Forbidden error
-- Run EACH statement separately in Supabase SQL Editor
-- If you get errors, skip that statement and move to the next

-- 1. Drop existing policies (run each line separately)
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;

-- 2. Create new policies (run each line separately)
CREATE POLICY "notifications_insert" ON public.notifications 
    FOR INSERT TO authenticated 
    WITH CHECK (true);

CREATE POLICY "notifications_select_own" ON public.notifications 
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications 
    FOR UPDATE TO authenticated 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete_own" ON public.notifications 
    FOR DELETE TO authenticated 
    USING (user_id = auth.uid());

-- 3. Verify policies were created (run this to check)
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'notifications';
