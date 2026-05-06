-- Fix profiles update policy to allow proper editing
-- Run this in Supabase SQL Editor

-- Drop existing update policy
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;

-- Create proper update policy WITH CHECK clause
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles 
  FOR UPDATE TO authenticated 
  USING (
    id = auth.uid() OR 
    get_user_role() IN ('admin', 'manager')
  )
  WITH CHECK (true);  -- Allow updating any fields

-- Also ensure the insert policy allows all fields
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

CREATE POLICY "profiles_insert" ON public.profiles 
  FOR INSERT TO authenticated 
  WITH CHECK (true);  -- Allow inserting with all fields

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'UPDATE';

SELECT 'Profiles update policy fixed' as status;
