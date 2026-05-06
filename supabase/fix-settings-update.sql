-- Fix profiles UPDATE policy to allow updating own profile fields
-- Run this in Supabase SQL Editor.

-- Drop existing update policy
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;

-- Create policy that allows:
-- 1. Users to update their OWN profile (any field)
-- 2. Admin/manager to update ANY profile
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles 
  FOR UPDATE TO authenticated 
  USING (
    id = auth.uid() OR 
    get_user_role() IN ('admin', 'manager')
  )
  WITH CHECK (true);  -- Allow updating any fields

-- Also ensure the insert policy is correct
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles 
  FOR INSERT TO authenticated 
  WITH CHECK (true);  -- Allow inserting with any fields

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'UPDATE';

SELECT 'Profiles UPDATE policy fixed - now allows updating own profile' as status;
