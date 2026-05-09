-- Fix Messages RLS policies for edit/update
-- Run EACH statement separately in Supabase SQL Editor

-- 1. Drop existing update policy
DROP POLICY IF EXISTS "messages_update_own" ON public.messages;

-- 2. Create new update policy allowing sender to edit their messages
CREATE POLICY "messages_update_own" ON public.messages
    FOR UPDATE TO authenticated
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

-- 3. Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'messages';
