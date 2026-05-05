-- Remove unnecessary password_hash column from profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_hash;

SELECT 'password_hash column removed' as status;

-- Verify the new structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
