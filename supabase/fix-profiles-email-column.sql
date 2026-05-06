-- Fix profiles table: Add email column
-- Run this in Supabase SQL Editor

-- 1. Add email column if not exists
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Update existing profiles with email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- 4. Verify the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 5. Create missing profiles for all auth users (doctors, staff, etc.)
INSERT INTO public.profiles (id, email, full_name, role, is_active)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email) as full_name,
    COALESCE((u.raw_user_meta_data->>'role')::text, 'frontdesk') as role,
    true as is_active
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 6. Verify profiles now exist
SELECT id, email, full_name, role, is_active 
FROM public.profiles 
ORDER BY created_at DESC;

SELECT 'Profiles table fixed - email column added and missing profiles created' as status;
